import type { Request, Response} from "express"
import type { EngineCallback } from "@vxness/types"
import { prisma } from "@vxness/db"
import { randomUUID } from "crypto"
import { dispatchToEngine } from "../redis.engine.client"


const ENGINE_TIMEOUT_MS = 10000;
const PRICE_PRECISION = 1000;
const QTY_PRECISION = 100;

type UserAsset =  {
    symbol: string;
    balanceRaw: number;
    balanceDecimals: number;
}

async function getUserAssets(userId: string): Promise<UserAsset[]> {
    const userAssets = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            wallets: {
                select: {
                    symbol: true,
                    balanceRaw: true,
                    balanceDecimals: true
                }
            }
        } 
    })

    return userAssets?.wallets ?? [];
}

//Sends a request to the trading engine and waits for response
//Uses the dispatchToEngine function to send the request
//@param requestId - Unique correlation ID for the request
//@param payload - The request payload to send to the trading engine
//@returns The response from the trading engine

async function sendToTradingEngineAndWait(requestId: string, payload: Record<string, any>) {
    console.log(`[Controller] Dispatching request ${requestId}:`, JSON.stringify(payload, null, 2))

    try {
        const response = await dispatchToEngine(requestId, payload, ENGINE_TIMEOUT_MS)

        console.log(`[Controller] Received response for ${requestId}:`, JSON.stringify(response, null, ))

        return response
    } catch (error) {
        console.error(`[Controller] Engine request ${requestId} failed:`, error);
        throw new Error(
            `Failed to communicate with trading engine: ${error instanceof Error ? error.message : "Unknown error"}`
        )
    }
}

