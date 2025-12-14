import { prisma } from "@vxness/db";
import createRedisClient from "@vxness/redis";
import { ENGINE_CONSTANTS, ORDER_PRECISION, REDIS_ENGINE_CONSTANTS, SYMBOL_DECIMALS, type DBTask, type engineOrder, type Side, type Symbol } from "@vxness/types"



const redisClient = createRedisClient()

const orders = new Map<string, engineOrder>();
const balances = new Map<string, Map<string, number>>();
const prices = new Map<string, { bid: number; ask: number }>();


let dbQueue: DBTask[] = []
let isFlushingDB = false;
let lastStreamId = "$";



const toInt = (val: number) => Math.round(val * ENGINE_CONSTANTS.PRECISION_SCALE);
const fromInt = (val: number) => val / ENGINE_CONSTANTS.PRECISION_SCALE;

const multiplyInt = (a: number, b: number) => {
    const bigA = BigInt(Math.round(a))
    const bigB = BigInt(Math.round(b))
    const scale = BigInt(ENGINE_CONSTANTS.PRECISION_SCALE);

    return Number((bigA * bigB) / scale);
};


//Calculate Pnl in Integers
const calcPnl = (side: Side, entry: number, current: number, qty: number): number => {
    const priceDiff = side === "long" ? current - entry : entry - current;
    return multiplyInt(priceDiff, qty);
};


//Database Batching System
//Queue a database operation to be executed in the next batch
function queueDbAction(action: DBTask) {
    if (dbQueue.length >= ENGINE_CONSTANTS.MAX_QUEUE_SIZE) {
        console.error(`[DB] Queue overflow! Size: ${dbQueue.length}. Dropping oldest tasks.`)
        dbQueue.shift();
    }
    dbQueue.push(action)
}


//Flush the Queue to the database in a single 
async function processDbQueue() {
    if (isFlushingDB || dbQueue.length === 0) return;
    isFlushingDB = true;

    //Take a snapshot of the current queue
    const batch = dbQueue.splice(0, ENGINE_CONSTANTS.DB_BATCH_SIZE);

    try {
        for (const task of batch) {
            try {
                if (task.type === "balance-update") {
                    const { userId, symbol, balance } = task.data;

                    // Get the correct decimals for this symbol
                    const decimals = SYMBOL_DECIMALS[symbol as Symbol] ?? 8;

                    // Convert from engine precision (100_000_000) to actual value
                    const actualValue = fromInt(balance);

                    // Convert to database format using symbol-specific decimals
                    const balanceRaw = BigInt(Math.round(actualValue * Math.pow(10, decimals)));

                    await prisma.wallet.upsert({
                        where: { userId_symbol: { userId, symbol } },
                        create: { userId, symbol, balanceRaw, balanceDecimals: decimals },
                        update: { balanceRaw }
                    });
                }

                else if (task.type === "order_create") {
                    await prisma.order.create({
                        data: task.data
                    })
                }

                else if (task.type === "order_close") {
                    try {
                        await prisma.order.update({
                            where: { id: task.data.id },
                            data: task.data.update
                        })
                    } catch (error: any) {
                        console.error(`[DB] Close Error ${task.data.id}`, error.message);
                    }
                }
            } catch (error) {
                console.error(`[DB] failed to process ${task.type}:`, error);
            }
        }
    } catch (error) {
        console.error("[DB] Critical Batch Error:", error);
    } finally {
        isFlushingDB = false;
    }
}

setInterval(processDbQueue, ENGINE_CONSTANTS.DB_FLUSH_INTERVAL_MS);


//Core Trading Logic
function getBalance(userId: string, symbol: string) {
    if (!balances.has(userId)) balances.set(userId, new Map());
    return balances.get(userId)!.get(symbol) || 0;
}

function setBalance(userId: string, symbol: string, amount: number) {
    if (!balances.has(userId)) balances.set(userId, new Map());
    balances.get(userId)!.set(symbol, amount);

    queueDbAction({
        type: "balance-update",
        data: { userId, symbol, balance: amount }
    })
}

async function sendCallback(orderId: string, status: string, payload: any = {}) {
    try {
        await redisClient.xadd(
            REDIS_ENGINE_CONSTANTS.CALLBACK_QUEUE,
            "*",
            "id", orderId,
            "status", status,
            "payload", JSON.stringify(payload)
        )
    } catch (e) {
        console.error("Redis Callback Error", e);
    }
}

function executeClose(order: engineOrder, price: number, reason: string, pnl: number) {
    let credit = order.initialMargin + pnl;
    if (credit < 0) credit = 0;

    const currentBalance = getBalance(order.userId, order.asset);
    setBalance(order.userId, order.asset, currentBalance + credit);

    orders.delete(order.id);

    // Map reason to Prisma CloseReason enum values (lowercase with underscores)
    const closeReasonMap: Record<string, string> = {
        'TAKE_PROFIT': 'take_profit',
        'STOP_LOSS': 'stop_loss',
        'LIQUIDATION': 'liquidation',
        'manual': 'manual',
        'Manual': 'manual',
    };
    const dbCloseReason = closeReasonMap[reason] || 'manual';

    queueDbAction({
        type: "order_close",
        data: {
            id: order.id,
            update: {
                status: 'closed',
                closePrice: Math.round(fromInt(price) * ORDER_PRECISION.PRICE),  // Schema uses closePrice, not closingPrice
                Pnl: Math.round(fromInt(pnl) * ORDER_PRECISION.PRICE),           // Schema uses Pnl (capital P), stored as Int
                closedAt: new Date(),
                closeReason: dbCloseReason
            }
        }
    });

    console.log(`[Closed] ${order.id} | ${reason} | Pnl: ${fromInt(pnl).toFixed(2)}`);
    sendCallback(order.id, "closed", { reason, pnl: fromInt(pnl), price: fromInt(price) })
}


function checkOrderRisk(order: engineOrder, currentPrice: number) {
    const pnl = calcPnl(order.side, order.openingPrice, currentPrice, order.qty);
    const remainingMargin = order.initialMargin + pnl;
    const maintMargin = multiplyInt(order.initialMargin, toInt(ENGINE_CONSTANTS.MARGIN_THRESHOLD))

    let reason: string | null = null;

    if (remainingMargin <= maintMargin) {
        reason = "LIQUIDATION";
    } else if (order.takeProfit && (
        (order.side === "long" && currentPrice >= order.takeProfit) ||
        (order.side === "short" && currentPrice <= order.takeProfit)
    )) {
        reason = "TAKE_PROFIT";
    } else if (order.stopLoss && (
        (order.side === "long" && currentPrice <= order.stopLoss) ||
        (order.side === "short" && currentPrice >= order.stopLoss)
    )) {
        reason = "STOP_LOSS"
    }

    if (reason) executeClose(order, currentPrice, reason, pnl);
}

async function handlePriceUpdate(payload: any) {
    // Skip if payload doesn't have required fields (e.g., subscription confirmations)
    // const data = payload.data || payload;

    //console.log("price-Update payload", payload)

    if (!payload || !payload.s || !payload.b || !payload.a) {
        return;
    }

    const { s, b, a } = payload;
    const symbol = s.replace("_USDC", "").toUpperCase();
    const bid = toInt(Number(b));
    const ask = toInt(Number(a));

    prices.set(symbol, { bid, ask })
    // console.log("prices of trades:", prices)

    for (const order of orders.values()) {
        if (order.asset !== symbol) continue;
        const marketPrice = order.side === "long" ? bid : ask;
        checkOrderRisk(order, marketPrice);
    }
}

async function handleCreateOrder(payload: any) {
    console.log(`[DEBUG] handleCreateOrder received payload:`, JSON.stringify(payload, null, 2));

    const { id, userId, asset, side, qty, leverage, takeProfit, stopLoss } = payload;

    console.log(`[DEBUG] Extracted qty: ${qty}, type: ${typeof qty}, Number(qty): ${Number(qty)}`);

    const normalizedAsset = asset.toUpperCase();

    if (orders.has(id)) return;

    const priceData = prices.get(normalizedAsset);

    if (!priceData) {
        return sendCallback(id, "no_price", { reason: "Price data not available for asset" });
    }

    const openingPrice = side === "long" ? priceData.ask : priceData.bid;
    const qtyInt = toInt(Number(qty));
    const lev = Number(leverage) || 1;

    const totalValue = multiplyInt(openingPrice, qtyInt);
    const marginRequired = Math.round(totalValue / lev)

    const userBal = getBalance(userId, "USDC");
    if (userBal < marginRequired) {
        return sendCallback(id, "insufficient_balance", { reason: "Not enough balance for margin requirement" })
    }

    setBalance(userId, "USDC", userBal - marginRequired);

    const order: engineOrder = {
        id, userId, asset: normalizedAsset, side,
        qty: qtyInt,
        leverage: lev,
        openingPrice,
        initialMargin: marginRequired,
        takeProfit: takeProfit ? toInt(Number(takeProfit)) : undefined,
        stopLoss: stopLoss ? toInt(Number(stopLoss)) : undefined,
        createdAt: Date.now()
    }

    orders.set(id, order);

    const orderData = {
        id,
        userId,
        symbol: normalizedAsset,
        side,
        quantity: Math.round(Number(qty) * ORDER_PRECISION.QUANTITY),
        quantityDecimals: 5,
        leverage: lev,
        openPrice: Math.round(fromInt(openingPrice) * ORDER_PRECISION.PRICE),
        priceDecimals: 2,
        margin: Math.round(fromInt(marginRequired) * ORDER_PRECISION.PRICE),
        status: "open",
        createdAt: new Date()
    };

    console.log(`[DB] Queuing order_create:`, JSON.stringify(orderData, null, 2));

    queueDbAction({
        type: "order_create",
        data: orderData
    })

    console.log(`{Create} Order ${id} opened @ ${fromInt(openingPrice)}`);
    sendCallback(id, "created", { price: fromInt(openingPrice) })
}


async function handleCloseOrder(payload: any) {
    const { orderId, userId } = payload;
    const order = orders.get(orderId);

    if (!order || order.userId !== userId) {
        return sendCallback(orderId || "unknown", "order_not_found", { reason: "Order not found or access denied" })
    }

    const priceData = prices.get(order.asset);
    const closePrice = priceData ? (order.side === "long" ? priceData.bid : priceData.ask) : order.openingPrice;
    const pnl = calcPnl(order.side, order.openingPrice, closePrice, order.qty);

    executeClose(order, closePrice, "manual", pnl);
}


async function handleBalanceUpdate(payload: any) {
    const { userId, symbol, newBalanceRaw, newBalanceDecimals } = payload;

    if (!userId || !symbol || newBalanceRaw === undefined) {
        console.error("[Balance-Update] missing required fields:", payload);
        return;
    }

    try {
        //convert from database format to actual decimal value
        //newBalanceRaw is a string representing a BigInt value
        const rawValue = Number(newBalanceRaw)
        const decimals = newBalanceDecimals ?? SYMBOL_DECIMALS[symbol as Symbol] ?? 8;
        const actualValue = rawValue / Math.pow(10, decimals);

        //convert to engine's internal precision (100_000_000)
        const engineScaledValue = toInt(actualValue);

        if (!balances.has(userId)) {
            balances.set(userId, new Map());
        }
        balances.get(userId)!.set(symbol, engineScaledValue);

        console.log(`[Balance-Update] ${userId} | ${symbol} | ${actualValue} (engine: ${engineScaledValue})`);
    } catch (error) {
        console.log('[Balance-Update] Error processing balance update:', error)
    }
}

//ENGINE
async function loadState() {
    console.log("Loading State...")

    const dbOrders = await prisma.order.findMany({
        where: { status: "open" }
    });


    dbOrders.forEach((order: any) => {
        // Database uses openPrice (Int) and quantity (Int) with ORDER_PRECISION
        // Need to convert from DB format to engine format
        const openPriceFromDb = Number(order.openPrice) / ORDER_PRECISION.PRICE;  // Convert from Int to actual price
        const quantityFromDb = Number(order.quantity) / ORDER_PRECISION.QUANTITY;  // Convert from Int to actual quantity

        const opPrice = toInt(openPriceFromDb);  // Convert to engine precision
        const q = toInt(quantityFromDb);         // Convert to engine precision

        orders.set(order.id, {
            id: order.id,
            userId: order.userId,
            asset: order.symbol,  // DB uses 'symbol', not 'asset'
            side: order.side as Side,
            qty: q,
            leverage: order.leverage,
            openingPrice: opPrice,
            initialMargin: multiplyInt(opPrice, q) / order.leverage,
            takeProfit: order.takeProfitPrice ? toInt(Number(order.takeProfitPrice) / ORDER_PRECISION.PRICE) : undefined,
            stopLoss: order.stopLossPrice ? toInt(Number(order.stopLossPrice) / ORDER_PRECISION.PRICE) : undefined,
            createdAt: order.createdAt.getTime()
        });

        console.log(`[LoadState] Loaded order ${order.id}: ${order.side} ${order.symbol} @ ${openPriceFromDb}`);
    })

    const dbBalances = await prisma.wallet.findMany();
    dbBalances.forEach((b: any) => {
        if (!balances.has(b.userId)) balances.set(b.userId, new Map());

        const decimals = b.balanceDecimals ?? SYMBOL_DECIMALS[b.symbol as Symbol] ?? 8;
        const rawVal = b.balanceRaw ? Number(b.balanceRaw) : 0;
        const actualValue = rawVal / Math.pow(10, decimals);
        const engineScaledValue = toInt(actualValue);

        balances.get(b.userId)!.set(b.symbol, engineScaledValue);
    });
    console.log(`State Loaded: ${orders.size} orders.`);
}

async function engine() {
    await loadState();
    console.log("Engine started")

    while (true) {
        try {
            const response = await redisClient.xread("BLOCK", 0, "STREAMS", REDIS_ENGINE_CONSTANTS.REQUEST_STREAM_KEY, lastStreamId);
            if (!response || !response[0]) continue;

            const [_, messages] = response[0];

            for (const [id, fields] of messages) {
                lastStreamId = id;

                try {
                    let rawData = ""
                    for (let i = 0; i < fields.length; i += 2) {
                        // httpServer uses "payload", pricePoller uses "data"
                        if (fields[i] === "data" || fields[i] === "payload") {
                            rawData = fields[i + 1] ?? ""
                        }
                    }
                    if (!rawData) continue

                    const msg = JSON.parse(rawData)
                    // Handle different message formats:
                    // - httpServer: { kind: "create-order", payload: {...} }
                    // - pricePoller: { kind: "price-update", payload: {...} }
                    const kind = msg.kind || msg.type;
                    const payload = msg.payload || msg.data;

                    // console.log(`[Engine] Received kind="${kind}"`)

                    switch (kind) {
                        case "price-update": await handlePriceUpdate(payload); break;
                        case "create-order": await handleCreateOrder(payload); break;
                        case "close-order": await handleCloseOrder(payload); break;
                        case "balance-update": await handleBalanceUpdate(payload); break;
                        default: console.log(`[Engine] Unknown kind: ${kind}, msg:`, JSON.stringify(msg).slice(0, 200));
                    }
                } catch (error) {
                    console.error(`[SKIP] Malformed message ${id}:`, error);
                }
            }
        } catch (error) {
            console.error("Engine Error:", error);
            await new Promise(r => setTimeout(r, 1000))
        }
    }
}

engine();