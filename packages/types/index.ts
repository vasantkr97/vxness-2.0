export type CandleResponse = {
    bucket: number;
    symbol: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    time: number;
}

export type UpstreamCandle = {
    start: number;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
};