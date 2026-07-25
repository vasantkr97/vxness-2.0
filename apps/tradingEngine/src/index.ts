import { prisma } from "@vxness/db"
import createRedisClient from "@vxness/redis"
import {
    ENGINE_CONSTANTS,
    ORDER_PRECISION,
    REDIS_ENGINE_CONSTANTS,
    SYMBOL_DECIMALS,
    type Side,
    type Symbol,
    type engineOrder,
} from "@vxness/types"

const redisClient = createRedisClient()
const orders = new Map<string, engineOrder>()
const balances = new Map<string, Map<string, number>>()
const prices = new Map<string, { bid: number; ask: number }>()
const tradeableAssets = ["BTC", "ETH", "SOL"] as const
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

let lastStreamId = "0-0"

type UnknownRecord = Record<string, unknown>
type TradeableAsset = typeof tradeableAssets[number]

const isRecord = (value: unknown): value is UnknownRecord =>
    typeof value === "object" && value !== null && !Array.isArray(value)

const isTradeableAsset = (value: string): value is TradeableAsset =>
    tradeableAssets.includes(value as TradeableAsset)

const isSide = (value: string): value is Side =>
    value === "long" || value === "short"

const toInt = (value: number) => Math.round(value * ENGINE_CONSTANTS.PRECISION_SCALE)
const fromInt = (value: number) => value / ENGINE_CONSTANTS.PRECISION_SCALE

const multiplyInt = (first: number, second: number) => {
    const firstValue = BigInt(Math.round(first))
    const secondValue = BigInt(Math.round(second))
    const scale = BigInt(ENGINE_CONSTANTS.PRECISION_SCALE)
    return Number((firstValue * secondValue) / scale)
}

const rawToEngine = (rawValue: bigint, decimals: number): number => {
    const precisionDigits = 8
    const difference = decimals - precisionDigits

    if (difference >= 0) {
        return Number(rawValue / (10n ** BigInt(difference)))
    }

    return Number(rawValue * (10n ** BigInt(-difference)))
}

const engineToRaw = (engineValue: number, decimals: number): bigint => {
    const precisionDigits = 8
    const difference = decimals - precisionDigits
    const roundedValue = BigInt(Math.round(engineValue))

    if (difference >= 0) {
        return roundedValue * (10n ** BigInt(difference))
    }

    const divisor = 10n ** BigInt(-difference)
    return (roundedValue + (divisor / 2n)) / divisor
}

const calcPnl = (side: Side, entry: number, current: number, qty: number): number => {
    const priceDifference = side === "long" ? current - entry : entry - current
    return multiplyInt(priceDifference, qty)
}

function getBalance(userId: string, symbol: string) {
    if (!balances.has(userId)) balances.set(userId, new Map())
    return balances.get(userId)!.get(symbol) || 0
}

function setBalance(userId: string, symbol: string, amount: number) {
    if (!balances.has(userId)) balances.set(userId, new Map())
    balances.get(userId)!.set(symbol, amount)
}

async function sendCallback(
    orderId: string,
    status: string,
    payload: Record<string, string | number | boolean | null> = {},
) {
    const fields = [
        "id", orderId,
        "status", status,
        "payload", JSON.stringify(payload),
    ]

    for (const [key, value] of Object.entries(payload)) {
        fields.push(key, String(value))
    }

    await redisClient.xadd(
        REDIS_ENGINE_CONSTANTS.CALLBACK_QUEUE,
        "*",
        ...fields,
    )
}

function normalizeCloseReason(reason: string) {
    switch (reason) {
        case "TAKE_PROFIT":
            return "take_profit" as const
        case "STOP_LOSS":
            return "stop_loss" as const
        case "LIQUIDATION":
            return "liquidation" as const
        default:
            return "manual" as const
    }
}

async function executeClose(
    order: engineOrder,
    price: number,
    reason: string,
    pnl: number,
    notifyRequester: boolean,
) {
    const credit = Math.max(0, order.initialMargin + pnl)
    const currentBalance = getBalance(order.userId, "USDC")
    const nextBalance = currentBalance + credit
    const usdcDecimals = SYMBOL_DECIMALS.USDC
    const closePrice = Math.round(fromInt(price) * ORDER_PRECISION.PRICE)
    const realizedPnl = Math.round(fromInt(pnl) * ORDER_PRECISION.PRICE)

    await prisma.$transaction([
        prisma.wallet.upsert({
            where: {
                userId_symbol: {
                    userId: order.userId,
                    symbol: "USDC",
                },
            },
            create: {
                userId: order.userId,
                symbol: "USDC",
                balanceRaw: engineToRaw(nextBalance, usdcDecimals),
                balanceDecimals: usdcDecimals,
            },
            update: {
                balanceRaw: engineToRaw(nextBalance, usdcDecimals),
                balanceDecimals: usdcDecimals,
            },
        }),
        prisma.order.update({
            where: { id: order.id },
            data: {
                status: "closed",
                closePrice,
                Pnl: realizedPnl,
                closedAt: new Date(),
                closeReason: normalizeCloseReason(reason),
            },
        }),
    ])

    setBalance(order.userId, "USDC", nextBalance)
    orders.delete(order.id)

    console.log(`[Closed] ${order.id} | ${reason} | PnL: ${fromInt(pnl).toFixed(2)}`)

    if (notifyRequester) {
        await sendCallback(order.id, "closed", {
            reason,
            pnl: fromInt(pnl),
            price: fromInt(price),
        })
    }
}

async function checkOrderRisk(order: engineOrder, currentPrice: number) {
    const pnl = calcPnl(order.side, order.openingPrice, currentPrice, order.qty)
    const remainingMargin = order.initialMargin + pnl
    const maintenanceMargin = multiplyInt(
        order.initialMargin,
        toInt(ENGINE_CONSTANTS.MARGIN_THRESHOLD),
    )

    let reason: string | null = null

    if (remainingMargin <= maintenanceMargin) {
        reason = "LIQUIDATION"
    } else if (order.takeProfit && (
        (order.side === "long" && currentPrice >= order.takeProfit) ||
        (order.side === "short" && currentPrice <= order.takeProfit)
    )) {
        reason = "TAKE_PROFIT"
    } else if (order.stopLoss && (
        (order.side === "long" && currentPrice <= order.stopLoss) ||
        (order.side === "short" && currentPrice >= order.stopLoss)
    )) {
        reason = "STOP_LOSS"
    }

    if (reason) {
        await executeClose(order, currentPrice, reason, pnl, false)
    }
}

async function handlePriceUpdate(payload: unknown) {
    if (!isRecord(payload)) return

    const rawSymbol = typeof payload.s === "string" ? payload.s : ""
    const bidValue = Number(payload.b)
    const askValue = Number(payload.a)
    const symbol = rawSymbol.replace("_USDC", "").toUpperCase()

    if (
        !isTradeableAsset(symbol) ||
        !Number.isFinite(bidValue) ||
        !Number.isFinite(askValue) ||
        bidValue <= 0 ||
        askValue <= 0
    ) {
        return
    }

    const bid = toInt(bidValue)
    const ask = toInt(askValue)

    if (!Number.isSafeInteger(bid) || !Number.isSafeInteger(ask)) {
        return
    }

    prices.set(symbol, { bid, ask })

    for (const order of [...orders.values()]) {
        if (order.asset !== symbol) continue
        const marketPrice = order.side === "long" ? bid : ask
        await checkOrderRisk(order, marketPrice)
    }
}

async function handleCreateOrder(payload: unknown) {
    if (!isRecord(payload)) return

    const id = typeof payload.id === "string" ? payload.id : ""
    const userId = typeof payload.userId === "string" ? payload.userId : ""
    const assetValue = typeof payload.asset === "string" ? payload.asset.toUpperCase() : ""
    const sideValue = typeof payload.side === "string" ? payload.side : ""
    const quantity = Number(payload.qty)
    const leverage = Number(payload.leverage)
    const takeProfitValue = payload.takeProfit == null ? undefined : Number(payload.takeProfit)
    const stopLossValue = payload.stopLoss == null ? undefined : Number(payload.stopLoss)

    if (!uuidPattern.test(id) || !uuidPattern.test(userId)) return

    if (
        !isTradeableAsset(assetValue) ||
        !isSide(sideValue) ||
        !Number.isFinite(quantity) ||
        quantity <= 0 ||
        !Number.isInteger(leverage) ||
        leverage < 1 ||
        leverage > 100 ||
        (takeProfitValue !== undefined && (!Number.isFinite(takeProfitValue) || takeProfitValue <= 0)) ||
        (stopLossValue !== undefined && (!Number.isFinite(stopLossValue) || stopLossValue <= 0))
    ) {
        await sendCallback(id, "invalid_order", { reason: "Invalid order parameters" })
        return
    }

    if (orders.has(id)) {
        await sendCallback(id, "created", { replayed: true })
        return
    }

    const persistedOrder = await prisma.order.findUnique({
        where: { id },
        select: {
            userId: true,
            status: true,
            openPrice: true,
        },
    })

    if (persistedOrder) {
        const status = persistedOrder.userId === userId ? "created" : "invalid_order"
        await sendCallback(id, status, {
            replayed: true,
            price: Number(persistedOrder.openPrice) / ORDER_PRECISION.PRICE,
        })
        return
    }

    const priceData = prices.get(assetValue)
    if (!priceData) {
        await sendCallback(id, "no_price", { reason: "Price data not available for asset" })
        return
    }

    const openingPrice = sideValue === "long" ? priceData.ask : priceData.bid
    const quantityInt = toInt(quantity)
    const takeProfit = takeProfitValue === undefined ? undefined : toInt(takeProfitValue)
    const stopLoss = stopLossValue === undefined ? undefined : toInt(stopLossValue)

    if (
        !Number.isSafeInteger(quantityInt) ||
        (takeProfit !== undefined && !Number.isSafeInteger(takeProfit)) ||
        (stopLoss !== undefined && !Number.isSafeInteger(stopLoss))
    ) {
        await sendCallback(id, "invalid_size", { reason: "Order exceeds precision limits" })
        return
    }

    const invalidTakeProfit = takeProfit !== undefined && (
        (sideValue === "long" && takeProfit <= openingPrice) ||
        (sideValue === "short" && takeProfit >= openingPrice)
    )
    const invalidStopLoss = stopLoss !== undefined && (
        (sideValue === "long" && stopLoss >= openingPrice) ||
        (sideValue === "short" && stopLoss <= openingPrice)
    )

    if (invalidTakeProfit || invalidStopLoss) {
        await sendCallback(id, "invalid_order", {
            reason: "Take-profit or stop-loss is on the wrong side of the market price",
        })
        return
    }

    const totalValue = multiplyInt(openingPrice, quantityInt)
    const marginRequired = Math.round(totalValue / leverage)

    if (!Number.isSafeInteger(totalValue) || !Number.isSafeInteger(marginRequired) || marginRequired <= 0) {
        await sendCallback(id, "invalid_size", { reason: "Order exceeds supported size" })
        return
    }

    const userBalance = getBalance(userId, "USDC")
    if (userBalance < marginRequired) {
        await sendCallback(id, "insufficient_balance", {
            reason: "Not enough balance for margin requirement",
        })
        return
    }

    const nextBalance = userBalance - marginRequired
    const decimals = SYMBOL_DECIMALS[assetValue]
    const order: engineOrder = {
        id,
        userId,
        asset: assetValue,
        side: sideValue,
        qty: quantityInt,
        leverage,
        openingPrice,
        initialMargin: marginRequired,
        takeProfit,
        stopLoss,
        createdAt: Date.now(),
    }

    await prisma.$transaction([
        prisma.wallet.upsert({
            where: {
                userId_symbol: {
                    userId,
                    symbol: "USDC",
                },
            },
            create: {
                userId,
                symbol: "USDC",
                balanceRaw: engineToRaw(nextBalance, SYMBOL_DECIMALS.USDC),
                balanceDecimals: SYMBOL_DECIMALS.USDC,
            },
            update: {
                balanceRaw: engineToRaw(nextBalance, SYMBOL_DECIMALS.USDC),
                balanceDecimals: SYMBOL_DECIMALS.USDC,
            },
        }),
        prisma.order.create({
            data: {
                id,
                userId,
                symbol: assetValue,
                side: sideValue,
                quantity: engineToRaw(quantityInt, decimals),
                quantityDecimals: decimals,
                leverage,
                openPrice: Math.round(fromInt(openingPrice) * ORDER_PRECISION.PRICE),
                priceDecimals: 2,
                margin: Math.round(fromInt(marginRequired) * ORDER_PRECISION.PRICE),
                takeProfitPrice: takeProfit === undefined
                    ? null
                    : Math.round(fromInt(takeProfit) * ORDER_PRECISION.PRICE),
                stopLossPrice: stopLoss === undefined
                    ? null
                    : Math.round(fromInt(stopLoss) * ORDER_PRECISION.PRICE),
                status: "open",
                createdAt: new Date(order.createdAt),
            },
        }),
    ])

    setBalance(userId, "USDC", nextBalance)
    orders.set(id, order)

    console.log(`[Create] Order ${id} opened @ ${fromInt(openingPrice)}`)
    await sendCallback(id, "created", { price: fromInt(openingPrice) })
}

async function handleCloseOrder(payload: unknown) {
    if (!isRecord(payload)) return

    const orderId = typeof payload.orderId === "string" ? payload.orderId : ""
    const userId = typeof payload.userId === "string" ? payload.userId : ""

    if (!uuidPattern.test(orderId) || !uuidPattern.test(userId)) return

    const order = orders.get(orderId)
    if (!order || order.userId !== userId) {
        const persistedOrder = await prisma.order.findFirst({
            where: {
                id: orderId,
                userId,
            },
            select: {
                status: true,
                Pnl: true,
            },
        })

        if (persistedOrder?.status === "closed") {
            await sendCallback(orderId, "closed", {
                replayed: true,
                pnl: Number(persistedOrder.Pnl ?? 0) / ORDER_PRECISION.PRICE,
            })
            return
        }

        await sendCallback(orderId, "order_not_found", {
            reason: "Order not found or access denied",
        })
        return
    }

    const priceData = prices.get(order.asset)
    const closePrice = priceData
        ? (order.side === "long" ? priceData.bid : priceData.ask)
        : order.openingPrice
    const pnl = calcPnl(order.side, order.openingPrice, closePrice, order.qty)

    await executeClose(order, closePrice, "manual", pnl, true)
}

async function handleBalanceUpdate(payload: unknown) {
    if (!isRecord(payload)) return

    const userId = typeof payload.userId === "string" ? payload.userId : ""
    const symbolValue = typeof payload.symbol === "string" ? payload.symbol.toUpperCase() : ""
    const decimals = Number(payload.newBalanceDecimals ?? SYMBOL_DECIMALS[symbolValue as Symbol])

    if (
        !uuidPattern.test(userId) ||
        !(symbolValue in SYMBOL_DECIMALS) ||
        !Number.isInteger(decimals) ||
        decimals < 0 ||
        decimals > 30 ||
        payload.newBalanceRaw === undefined
    ) {
        console.error("[Balance-Update] Invalid payload")
        return
    }

    try {
        const rawValue = BigInt(String(payload.newBalanceRaw))
        const engineScaledValue = rawToEngine(rawValue, decimals)

        setBalance(userId, symbolValue, engineScaledValue)
        console.log(`[Balance-Update] ${userId} | ${symbolValue} | engine: ${engineScaledValue}`)
    } catch (error) {
        console.error("[Balance-Update] Failed to process update:", error)
    }
}

async function loadState() {
    console.log("Loading state...")

    const dbOrders = await prisma.order.findMany({
        where: { status: "open" },
    })

    for (const order of dbOrders) {
        const decimals = SYMBOL_DECIMALS[order.symbol as Symbol] ?? 8
        const openingPrice = toInt(Number(order.openPrice) / ORDER_PRECISION.PRICE)
        const quantity = rawToEngine(order.quantity, decimals)

        orders.set(order.id, {
            id: order.id,
            userId: order.userId,
            asset: order.symbol,
            side: order.side as Side,
            qty: quantity,
            leverage: order.leverage,
            openingPrice,
            initialMargin: toInt(Number(order.margin) / ORDER_PRECISION.PRICE),
            takeProfit: order.takeProfitPrice == null
                ? undefined
                : toInt(Number(order.takeProfitPrice) / ORDER_PRECISION.PRICE),
            stopLoss: order.stopLossPrice == null
                ? undefined
                : toInt(Number(order.stopLossPrice) / ORDER_PRECISION.PRICE),
            createdAt: order.createdAt.getTime(),
        })
    }

    const dbBalances = await prisma.wallet.findMany()
    for (const balance of dbBalances) {
        const decimals = balance.balanceDecimals ?? SYMBOL_DECIMALS[balance.symbol as Symbol] ?? 8
        setBalance(balance.userId, balance.symbol, rawToEngine(balance.balanceRaw, decimals))
    }

    console.log(`State loaded: ${orders.size} open orders.`)
}

async function processMessage(fields: string[]) {
    let rawData = ""

    for (let index = 0; index < fields.length; index += 2) {
        if (fields[index] === "data" || fields[index] === "payload") {
            rawData = fields[index + 1] ?? ""
        }
    }

    if (!rawData) return

    const message: unknown = JSON.parse(rawData)
    if (!isRecord(message)) return

    const kind = typeof message.kind === "string"
        ? message.kind
        : typeof message.type === "string"
            ? message.type
            : ""
    const payload = message.payload ?? message.data

    switch (kind) {
        case "price-update":
            await handlePriceUpdate(payload)
            break
        case "create-order":
            await handleCreateOrder(payload)
            break
        case "close-order":
            await handleCloseOrder(payload)
            break
        case "balance-update":
            await handleBalanceUpdate(payload)
            break
        default:
            console.warn(`[Engine] Ignoring unknown message kind: ${kind || "(missing)"}`)
    }
}

async function engine() {
    await loadState()
    console.log("Engine started")

    while (true) {
        try {
            const response = await redisClient.xread(
                "BLOCK",
                0,
                "STREAMS",
                REDIS_ENGINE_CONSTANTS.REQUEST_STREAM_KEY,
                lastStreamId,
            )

            if (!response?.[0]) continue

            const messages = response[0][1]
            let retryCurrentMessage = false

            for (const [id, fields] of messages) {
                try {
                    await processMessage(fields)
                    await redisClient.xdel(REDIS_ENGINE_CONSTANTS.REQUEST_STREAM_KEY, id)
                    lastStreamId = id
                } catch (error) {
                    console.error(`[Engine] Failed message ${id}; it will be retried:`, error)
                    retryCurrentMessage = true
                    break
                }
            }

            if (retryCurrentMessage) {
                await new Promise(resolve => setTimeout(resolve, 1000))
            }
        } catch (error) {
            console.error("Engine error:", error)
            await new Promise(resolve => setTimeout(resolve, 1000))
        }
    }
}

engine().catch(error => {
    console.error("Engine failed to start:", error)
    process.exit(1)
})
