import { z } from "zod" 

export const CreateOrderBodySchema = z.object({
    asset: z.string().transform(v => v.toUpperCase()).pipe(z.enum(["BTC", "ETH", "SOL"])),
    side: z.enum(["long", "short"]),
    qty: z.coerce.number().positive().max(1_000_000),
    leverage: z.coerce.number().int().min(1).max(100),
    takeProfit: z.coerce.number().positive().max(10_000_000).optional(),
    stopLoss: z.coerce.number().positive().max(10_000_000).optional(),
})

export type CreateOrderBody = z.infer<typeof CreateOrderBodySchema>;

export const CloseOrderBodySchema = z.object({
    closeReason: z.enum(["TakeProfit", "StopLoss", "Manual", "Liquidation"]).optional(),
})

export type CloseOrderBody = z.infer<typeof CloseOrderBodySchema>
