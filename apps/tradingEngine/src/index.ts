import { prisma } from "@vxness/db";
import { createRedisClient } from "@vxness/redis"


const CONFIG = {
    STREAM_KEY: "trading-engine",
    CALLBACK_QUEUE: "callback-queue",
    PRECISION_SCALE: 100_000_000,
    DB_BATCH_SIZE: 100,
    DB_FLUSH_INTERVAL_MS: 1000,
    MARGIN_THRESHOLD: 0.05,
    MAX_QUEUE_SIZE: 10000,
}

type Side = "long" | "short"

interface Order {
    id: string,
    userId: string;
    asset: string;
    side: Side;
    qty: number;
    leverage: number;
    openingPrice: number;
    initialMargin: number;
    takeProfit?: number;
    stopLoss?: number;
    createdAt: number;
}

interface DBTask {
    type: "balance" | "order_create" | "order_close";
    data: any;
}

const redisClient = createRedisClient()

const orders = new Map<string, Order>();
const balances = new Map<string, Map<string, number>>();
const prices = new Map<string, { bid: number; ask: number }>();


let dbQueue: DBTask[] = []
let isFlushingDB = false;
let lastStreamId = "$"; 



const toInt = (val: number) => Math.round(val * CONFIG.PRECISION_SCALE);
const fromInt = (val: number) => val / CONFIG.PRECISION_SCALE;

const multiplyInt = (a: number, b: number) => {
    const bigA = BigInt(Math.round(a))
    const bigB = BigInt(Math.round(b))
    const scale = BigInt(CONFIG.PRECISION_SCALE);

    return Number((bigA*bigB) / scale);
};


//Calculate Pnl in Integers
const calcPnl = (side: Side, entry: number, current: number, qty: number): number => {
    const priceDiff = side === "long" ? current - entry : entry - current;
    return multiplyInt(priceDiff, qty);
};


//Database Batching System
//Queue a database operation to be executed in the next batch
function queueDbAction(action: DBTask) {
    if (dbQueue.length >= CONFIG.MAX_QUEUE_SIZE) {
        console.error(`[DB] Queue overflow! Size: ${dbQueue.length}. Dropping oldest tasks.`)
    }
    dbQueue.push(action)
}


//Flush the Queue to the database in a single 
async function processDbQueue() {
    if (isFlushingDB || dbQueue.length === 0) return;
    isFlushingDB = true;

    //Take a snapshot of the current queue
    const batch = dbQueue.splice(0, CONFIG.DB_BATCH_SIZE);
    
    try {
        for (const task of batch) {
            try {
                if (task.type === "balance") {
                    const { userId, symbol, balance } = task.data;

                    await prisma.wallet.upsert({
                        where: { userId_symbol: { userId, symbol }},
                        create: { userId, symbol, balanceRaw: fromInt(balance), balanceDecimals: 8},
                        update: { balanceRaw: fromInt(balance) }
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

setInterval(processDbQueue, CONFIG.DB_FLUSH_INTERVAL_MS);


//Core Trading Logic
function getBalance(userId: string, symbol: string) {
    if (!balances.has(userId)) balances.set(userId, new Map());
    return balances.get(userId)!.get(symbol) || 0;
}

function setBalance(userId: string, symbol: string, amount: number) {
    if (!balances.has(userId)) balances.set(userId, new Map());
    balances.get(userId)!.set(symbol, amount);

    queueDbAction({
        type: "balance",
        data: { userId, symbol, balance: amount }
    })
}

async function sendCallback(orderId: string, status: string, payload: any = {}) {
    try {
        await redisClient.xadd(
            CONFIG.CALLBACK_QUEUE, 
            "*", 
            "id", orderId, 
            "status", status, 
            "payload", JSON.stringify(payload)
        )
    } catch(e) {
        console.error("Redis Callback Error", e);
    }
}

function executeClose(order: Order, price: number, reason: string, pnl: number) {
    let credit = order.initialMargin + pnl;
    if(credit < 0) credit = 0;

    const currentBalance = getBalance(order.userId, order.asset);
    setBalance(order.userId, order.asset, currentBalance + credit);

    orders.delete(order.id);

    queueDbAction({
        type: "order_close",
        data: {
            id: order.id,
            update: {
                status: 'closed',
                closingPrice: fromInt(price),
                pnl: fromInt(pnl),
                closedAt: new Date(),
                closeReason: reason
            }
        }
    });

    console.log(`[Closed] ${order.id} | ${reason} | Pnl: ${fromInt(pnl).toFixed(2)}`);
    sendCallback(order.id, "closed", { reason, pnl: fromInt(pnl), price: fromInt(price) })
}


function checkOrderRisk(order: Order, currentPrice: number) {
    const pnl = calcPnl(order.side, order.openingPrice, currentPrice, order.qty);
    const remainingMargin = order.initialMargin + pnl;
    const maintMargin = multiplyInt(order.initialMargin, toInt(CONFIG.MARGIN_THRESHOLD))

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
    const { s, b, a } = payload;
    const symbol = s.replace("_USDC", "").toUpperCase();
    const bid = toInt(Number(b));
    const ask = toInt(Number(a));

    prices.set(symbol, { bid, ask })

    for (const order of orders.values()) {
        if (order.asset !== symbol) continue;
        const marketPrice = order.side === "long" ? bid : ask;
        checkOrderRisk(order, marketPrice);
    }
}

async function handleCreateOrder(payload: any) {
    const { id, userId, asset, side, qty, leverage, takeProfit, stopLoss } = payload;

    if (orders.has(id)) return;

    const priceData = prices.get(asset);

    if (!priceData) {
        return sendCallback(id, "failed", { reason: "NO_PRICE" });
    }

    const openingPrice = side === "long" ? priceData.ask : priceData.bid;
    const qtyInt = toInt(Number(qty));
    const lev = Number(leverage) || 1;

    const totalValue = multiplyInt(openingPrice, qtyInt);
    const marginRequired = Math.round(totalValue/lev)

    const userBal = getBalance(userId, "USDC");
    if (userBal < marginRequired) {
        return sendCallback(id, "failed", { reason: "INSUFFICIENT_BALANCE"})
    }

    setBalance(userId, "USDC", userBal - marginRequired);

    const order: Order = {
        id, userId, asset, side,
        qty: qtyInt,
        leverage: lev,
        openingPrice,
        initialMargin: marginRequired,
        takeProfit: takeProfit ? toInt(Number(takeProfit)) : undefined,
        stopLoss: stopLoss ? toInt(Number(stopLoss)) : undefined,
        createdAt: Date.now()
    }

    orders.set(id, order);

    queueDbAction({
        type: "order_create",
        data: {
            id, userId, asset, side,
            qty: Number(qty),
            leverage: lev,
            openingPrice: fromInt(openingPrice),
            status: "open",
            createdAt: new Date()
        }
    })
    
    console.log(`{Create} Order ${id} opened @ ${fromInt(openingPrice)}`);
    sendCallback(id, "opened", { price: fromInt(openingPrice)})
}

async function handleCloseOrder(payload: any) {
    const { orderId, userId } = payload;
    const order = orders.get(orderId);
    
    if (!order || order.userId !== userId) {
        return sendCallback(orderId || "unknown", "failed", { reason: "NOT_FOUND"})
    }

    const priceData = prices.get(order.asset);
    const closePrice = priceData ? (order.side === "long" ? priceData.bid : priceData.ask) : order.openingPrice;
    const pnl = calcPnl(order.side, order.openingPrice, closePrice, order.qty);

    executeClose(order, closePrice, "MANUAL", pnl);
}

//ENGINE
async function loadState(){
    console.log("Loading State...")

    const dbOrders = await prisma.order.findMany({
        where: { status: "open" }
    });


    dbOrders.forEach((order: any) => {

        const opPrice = Number(order.openingPrice);
        const q = Number(order.qty);

        orders.set(order.id, {
            id: order.id, userId: order.userId, asset: order.asset, side: order.side as Side,
            qty: toInt(q),
            leverage: order.leverage,
            openingPrice: toInt(opPrice),

            initialMargin: toInt(opPrice * q) / order.leverage,
            takeProfit: order.takeProfit ? toInt(order.takeProfit) : undefined,
            stopLoss: order.stopLoss ? toInt(order.stopLoss) : undefined,
            createdAt: order.createdAt.getTime()
        });
    })

    const dbBalances = await prisma.wallet.findMany();
    dbBalances.forEach((b: any) => {
        if (!balances.has(b.userId)) balances.set(b.userId, new Map());
        const val = b.balanceRaw ? Number(b.balanceRaw) : 0;
        balances.get(b.userId)!.set(b.symbol, toInt(val));
    });
    console.log(`State Loaded: ${orders.size} orders.`);
}

async function engine() {
    await loadState();
    console.log("Engine started")

    while (true) {
        try {
            const response = await redisClient.xread("BLOCK", 0, "STREAMS", CONFIG.STREAM_KEY, lastStreamId);
            if (!response || !response[0]) continue;

            const [_, messages] = response[0];

            for (const [id, fields] of messages) {
                lastStreamId = id;

                try {
                    let rawData = ""
                    for (let i = 0; i < fields.length; i+=2) {
                        if (fields[i] === "data") rawData = fields[i+1] ?? ""
                    }
                    if (!rawData) continue

                    const msg = JSON.parse(rawData)
                    const type = msg.type || msg.requests?.kind;
                    const payload = msg.data || msg.request?.payload;

                    switch (type) {
                        case "check_price": await handlePriceUpdate(payload); break;
                        case "create_order": await handleCreateOrder(payload); break;
                        case "close_request": await handleCloseOrder(payload); break; 
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