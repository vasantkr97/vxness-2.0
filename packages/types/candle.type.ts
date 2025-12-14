export interface CandleResponse {
    bucket: number;
    symbol: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    time: number;
}

export interface UpstreamCandle {
    start: number;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
};


export type SymbolType = Record<string, string>

export const SYMBOL_MAP: SymbolType = {
    BTCUSDT: "BTC_USDC",
    BTCUSDC: "BTC_USDC",
    ETHUSDT: "ETH_USDC",
    ETHUSDC: "ETH_USDC",
    SOLUSDT: "SOL_USDC",
    SOLUSDC: "SOL_USDC",
}

//timeFrame(time Window) -> number of seconds
export type TimeWindowType = Record<string, number>

export const TIME_WINDOW_MAP: TimeWindowType = {
    "1m": 24 * 60 * 60,
    "3m": 2 * 24 * 60 * 60,
    "5m": 3 * 24 * 60 * 60,
    "15m": 7 * 24 * 60 * 60,
    "30m": 14 * 24 * 60 * 60,
    "1h": 30 * 24 * 60 * 60,
    "2h": 45 * 24 * 60 * 60,
    "4h": 60 * 24 * 60 * 60,
    "12h": 180 * 24 * 60 * 60,
    "1d": 365 * 24 * 60 * 60,
    "3d": 3 * 365 * 24 * 60 * 60,
    "1w": 2 * 365 * 24 * 60 * 60,
    "1M": 5 * 365 * 24 * 60 * 60,
}

//Default fallback time range: 7 days
export const DEFAULT_TIME_RANGE_SECONDS = 7*24*60*60