import { z } from "zod"

export const SymbolSchema = z.enum(["SOL", "BTC", "USDC", "ETH"])

export const GetWalletBalanceBySymbol  = z.object({
    symbol: SymbolSchema
})

export const DepositWalletBalanceBySymbol = z.object({
    symbol: SymbolSchema,
    amount: z.coerce.number().positive(),
    decimals: z.coerce.number().int().min(0).max(8).default(2)
})

