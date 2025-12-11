import type { Request, Response } from "express"
import { prisma } from "@vxness/db"
import { randomUUID } from "crypto"
import { dispatchToEngine } from "../redis.engine.client"
import { CloseOrderBodySchema, CreateOrderBodySchema } from "../schemas/order.ZodType"

const ENGINE_TIMEOUT_MS = 10000;
const PRICE_PRECISION = 100;
const QTY_PRECISION = 100000;


function mapEngineResponse(res: Response, status: any, orderId: string) {
    switch (status) {
        case "insufficient_balance":
            return res.status(400).json({
                error: "insufficient balance",
                message: "Not enough balance to place order"
            })

        case "no_price":
            return res.status(400).json({
                error: "Price not available",
                message: "Market price is currently unavailable. Please try again later.",
            });

        case "invalid_size":
            return res.status(400).json({
                error: "Invalid size",
                message: "The order size is invalid",
            })

        case "invalid_order":
            return res.status(400).json({
                error: "Invalid order",
                message: "The order parameters are invalid",
            })

        case "order_not_found":
        case "already_closed":
            return res.status(404).json({
                error: "Order Closed",
                message: "The Order cannot be closed because it is not open or does not exists."
            })

        default:
            console.error(`[Order] Unhandled engine status '${status}' for order ${orderId}`)
            return res.status(500).json({ error: "Execution Error", message: "The order Engine returned an unexpected status." })
    }
}

function transformOrder(order: any) {
    return {
        id: order.id,
        symbol: order.symbol || "BTC",
        orderType: order.side === "long" ? "long" : "short",
        quantity: order.quantity != null ? order.quantity / QTY_PRECISION : null,
        price: order.openPrice != null ? order.openPrice / PRICE_PRECISION : null,
        status: order.status,
        pnl: order.Pnl != null ? order.Pnl / PRICE_PRECISION : null,
        createdAt: order.createdAt.toISOString(),
        closedAt: order.closedAt?.toISOString(),
        exitPrice: order.closePrice != null ? order.closePrice / PRICE_PRECISION : undefined,
        leverage: order.leverage,
        takeProfit: order.takeProfitPrice != null ? order.takeProfitPrice / PRICE_PRECISION : undefined,
        stopLoss: order.stopLossPrice != null ? order.stopLossPrice / PRICE_PRECISION : undefined,
        closeReason: order.closeReason,
    }
}

// async function getUserBalanceSnapshot(userId: string): Promise<UserBalance[]> {
//     const user = await prisma.user.findUnique({
//         where: { id: userId },
//         select: {
//             wallets: {
//                 select: {
//                     symbol: true,
//                     balanceRaw: true,
//                     balanceDecimals: true
//                 }
//             }
//         }
//     })

//     return user?.wallets ?? [];
// }


//Create Order
export const createOrder = async (req: Request, res: Response) => {
    const userId = req.user?.id;

    try {
        if (!userId) {
            return res.status(401).json({ error: "User not found" });
        }

        const validation = CreateOrderBodySchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: "Validation Error", details: validation.error.message });
        }

        const { asset, side, qty, leverage, takeProfit, stopLoss } = validation.data;
        const orderId = randomUUID();

        const payload = {
            kind: "create-order",
            payload: {
                id: orderId,
                userId,
                asset,
                side,
                status: "open",
                qty: Number(qty),
                leverage: Number(leverage),

                takeProfit: takeProfit != null ? Number(takeProfit) : null,
                stopLoss: stopLoss != null ? Number(stopLoss) : null,
                enqueuedAt: Date.now(),
            },
        };

        console.log(`[Order] Creating ${side} ${asset} order ${orderId} for user ${userId}`);

        //Dispatch to Redis Engine
        const engineResponse = await dispatchToEngine(orderId, payload, ENGINE_TIMEOUT_MS);

        console.log(`[Order] Engine Response for ${orderId}:`, engineResponse);

        if (engineResponse.status === "created") {
            return res.status(201).json({
                message: "Order created Successfully",
                orderId,
            })
        }

        return mapEngineResponse(res, engineResponse.status, orderId)
    } catch (err: any) {
        if (err.message?.includes("timeout")) {
            console.error(`[Order] Timeout creating order.`)
            return res.status(504).json({ error: "Gateway Timeout", message: "Order creation timed out. Please check your open orders." })
        }
        console.error("[Order] createOrder error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
}


export const CloseOrder = async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const userId = req.user?.id;

    try {
        if (!userId) {
            return res.status(401).json({ error: "User not Found" })
        }

        if (!orderId) return res.status(400).json({ error: "Order Id required" })

        const parsed = CloseOrderBodySchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.message });
        }

        const { closeReason = "Manual" } = parsed.data

        console.log(`[Order] Requesting close for ${orderId} by user ${userId}`);



        const existingOrder = await prisma.order.findFirst({
            where: {
                id: orderId,
                userId,
                status: "open",
            }
        })

        if (!existingOrder) {
            return res.status(404).json({
                error: "Order not found or already closed",
            })
        }

        console.log(`[Order] closing order ${orderId} for user ${userId}`);

        const payload = {
            kind: "close-order",
            payload: {
                orderId,
                userId,
                closeReason,

                closedAt: Date.now()
            }
        }

        const engineResponse = await dispatchToEngine(orderId, payload, ENGINE_TIMEOUT_MS);

        console.log(`[Order] close response for ${orderId}:`, engineResponse.status);

        if (engineResponse.status === "closed") {
            return res.status(200).json({
                message: "Order closed successfully",
                orderId,
                finalPnl: engineResponse.pnl
            });
        }

        return mapEngineResponse(res, engineResponse.status, orderId)

    } catch (err: any) {
        if (err.message?.includes("timeout")) {
            return res.status(504).json({ error: "Gateway Timeout", message: "Closing order timed out. Check status." })
        }
        console.error("[Order] closeOrder error:", err)
        return res.status(500).json({ error: "Internal Server Error" })
    }
}

//Get all Orders
export const getOrders = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "User not found" })
        }

        const orders = await prisma.order.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        })

        res.json({
            orders: orders.map(transformOrder)
        })
    } catch (err) {
        console.error("Error in getOrders:", err)
        return res.status(500).json({ error: "Internal server error" });
    }
}
