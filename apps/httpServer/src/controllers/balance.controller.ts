import type { Request, Response } from "express"
import { redis } from "@vxness/redis"
import { prisma } from "@vxness/db"
import { SYMBOL_DECIMALS, type Symbol } from "@vxness/types"
import { GetWalletBalanceBySymbol, DepositWalletBalanceBySymbol, type DepositWalletType } from "../schemas/balance.zodType"

// Helper to transform wallet data for JSON serialization
function transformWallet(wallet: { symbol: string; balanceRaw: bigint; balanceDecimals: number }) {
    return {
        symbol: wallet.symbol,
        balanceRaw: wallet.balanceRaw.toString(),
        balanceDecimals: wallet.balanceDecimals
    }
}

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
            balances: balances.map(transformWallet)
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

    const validatedResult = GetWalletBalanceBySymbol.safeParse(req.params);

    if (!validatedResult.success) {
        return res.status(400).json({
            error: "Invalid request parameters",
            details: validatedResult.error
        })
    }

    const { symbol } = validatedResult.data

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

        return res.json(transformWallet(wallet))
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
        return res.status(401).json({ error: "Unauthorized" })
    }

    const parseResult = DepositWalletBalanceBySymbol.safeParse(req.body);

    if (!parseResult.success) {
        return res.status(400).json({
            error: "Invalid request body",
            details: parseResult.error
        })
    }

    const query: DepositWalletType = parseResult.data

    const { symbol, amount, decimals } = query

    // Get the correct decimals for this cryptocurrency
    const correctDecimals = SYMBOL_DECIMALS[symbol as Symbol];

    // If decimals provided, validate it matches the symbol's required decimals
    if (decimals !== undefined && decimals !== correctDecimals) {
        return res.status(400).json({
            error: `Invalid decimals for ${symbol}. Expected ${correctDecimals}, got ${decimals}`
        })
    }

    const decimalPlaces = correctDecimals;

    if (amount <= 0) {
        return res.status(400).json({ error: "Amount must be positive" })
    }
    const baseUnitAmount = BigInt(Math.round(amount * Math.pow(10, decimalPlaces)))

    if (baseUnitAmount <= 0n) {
        return res.status(400).json({ error: "invalid amount" })
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
                        newBalanceRaw: updatedWallet.balanceRaw.toString(),
                        newBalanceDecimals: updatedWallet.balanceDecimals
                    }
                })
            )
        } catch (error) {
            console.error("Failed to publish balance update to trading-engine stream:", error)
        }

        return res.json(transformWallet(updatedWallet))

    } catch (err) {
        console.error("depositToWallet:", err)
        return res.status(500).json({ error: "Failed to process deposit" })
    }
}