import type { Request, Response } from "express"
import { redis } from "@vxness/redis"
import { prisma } from "@vxness/db"

import { GetWalletBalanceBySymbol, DepositWalletBalanceBySymbol } from "../schemas/balance.zodType"



export const getBalance = async (req: Request, res: Response) => {
    const userId = req.user?.id

    if (!userId) {
        return res.status(401).json({
            msg: "Unauthorized: user not  found on request"
        });
    }

    try {
        const balances = await prisma.wallet.findMany({
            where: { userId },
            select: {
                symbol: true,
                balanceRaw: true,
                balanceDecimals: true,
            }
        })

        return res.json({ 
            userId, 
            balances 
        })
    } catch (error) {
        return res.status(500).json({
            msg: "Internal server error",
            error
        })
    }
}

export const getBalanceBySymbol = async (req: Request, res: Response) => {
    const userId = req.user?.id

    if (!userId) {
        return res.status(401).json({
            msg: "Unauthorized: user not found on request"
        })
    }

    const parsedResult = GetWalletBalanceBySymbol.safeParse(req.params);

    if (!parsedResult.success) {
        return res.status(400).json({
            error: "Invalid request parameters",
            details: parsedResult.error
        })
    }

    const { symbol } = parsedResult.data

    try {
        const wallet = await prisma.wallet.findUnique({
            where: {
                userId_symbol: {
                    userId, 
                    symbol
                }
            },
            select: {
                symbol: true,
                balanceRaw: true,
                balanceDecimals: true
            },
        });

        if (!wallet) {
            return res.status(404).json({
                error: "wallet not found"
            })
        }

        return res.json(wallet)
    } catch (error) {
        return res.status(400).json({
            msg: "Failed to fetch wallet balances for assets",
            error
        })
    }
}

export const depositToWallet = async (req: Request, res: Response) => {
    const userId = req.user?.id

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized"})
    }

    const parseResult = DepositWalletBalanceBySymbol.safeParse(req.body);

    if (!parseResult.success) {
        return res.status(400).json({
            error: "Invalid request body",
            details: parseResult.error
        })
    }

    const { symbol, amount, decimals } = parseResult.data
    const decimalPlaces = decimals ?? 8

    if (amount <= 0) {
        return res.status(400).json({ error: "Amount must be positive"})
    }
    const baseUnitAmount = Math.round(amount*Math.pow(10, decimalPlaces))

    if (!Number.isFinite(baseUnitAmount) || baseUnitAmount <= 0) {
        return res.status(400).json({ error: "invalid amount"})
    }

    try {
        const updatedWallet = await prisma.wallet.upsert({
            where: {
                userId_symbol: {
                    userId,
                    symbol,
                }
            },
            create: {
                userId,
                symbol,
                balanceRaw: baseUnitAmount,
                balanceDecimals: decimalPlaces
            },
            update: {
                balanceRaw: { increment: baseUnitAmount },
            },
            select: {
                symbol: true,
                balanceRaw: true,
                balanceDecimals: true
            }
        })

        //Producer(Publishing to Stream-publisher)
        try {
            await redis.xadd(
                "trading-engine", //Streams(key)
                "*", //Auto generated ID
                "data",
                JSON.stringify({
                    kind: "balance-update",
                    payload: {
                        userId,
                        symbol: updatedWallet.symbol,
                        newBalanceRaw: updatedWallet.balanceRaw,
                        newBalanceDecimals: updatedWallet.balanceDecimals
                    }
                })
            )
        } catch (error) {
            console.error("Failed to publish balance update to trading-engine stream:", error)
        }

        return res.json(updatedWallet)
        
    } catch (err) {
        console.error("depositToWallet:", err)
        return res.status(500).json({ error: "Failed to process deposit"})
    }
}