import type { Request, Response } from "express"
import { DEFAULT_TIME_RANGE_SECONDS, SYMBOL_MAP, TIME_WINDOW_MAP, type CandleResponse, type UpstreamCandle } from "@vxness/types"
import { GetCandlesQuerySchema, type GetCandlesQueryType } from "../schemas/candles.zodType"



export async function getCandles(req: Request, res: Response): Promise<void> {
    const validatedResult = GetCandlesQuerySchema.safeParse(req.query)

    if (!validatedResult.success) {
        res.status(400).json({
            error: "Invalid query parameters",
            details: validatedResult.error.message
        })
        return
    }

    const query: GetCandlesQueryType = validatedResult.data

    const { timeFrame, asset } = query

    try {
        //Normalize asset name to uppercase
        const assetKey = asset.toUpperCase()

        if (!SYMBOL_MAP[assetKey]) {
            res.status(400).json({ error: `Unsupported asset: ${asset}`})
            return
        }
        const symbol = SYMBOL_MAP[assetKey]

        //Resolve time window
        const timeRangeInSeconds = TIME_WINDOW_MAP[timeFrame] ?? DEFAULT_TIME_RANGE_SECONDS

        const now = Math.floor(Date.now() / 1000);
        const startTime = now - timeRangeInSeconds;
        const endTime = now;

        //Construct Request URL
        const url = new URL("https://api.backpack.exchange/api/v1/klines")
        url.searchParams.set("symbol", symbol)
        url.searchParams.set("interval", timeFrame)
        url.searchParams.set("startTime", startTime.toString())
        url.searchParams.set("endTime", endTime.toString())

        const upstream = await fetch(url.toString())
        
        if (!upstream.ok) {
            const body = await upstream.text()

            console.error(
                `Backpack upstream failure: ${upstream.status} ${upstream.statusText}`,
                body
            )
            throw new Error(
            `Backpack api responded with status ${upstream.status}`
            )
        };

        const json = (await upstream.json()) as UpstreamCandle[];

        const transformed: CandleResponse[] = json.map((candle: UpstreamCandle) => ({
            bucket: candle.start,
            symbol: assetKey,
            open: Number(candle.open),
            high: Number(candle.high),
            low: Number(candle.low),
            close: Number(candle.close),
            volume: Number(candle.volume),
            time: candle.start
        }))

        res.json({ data: transformed })
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error"

        console.error("Candles handler failure:", error)

        res.status(500).json({
            error: "failed to fetch candles from upstream API",
            details: message,
        })
    }
}