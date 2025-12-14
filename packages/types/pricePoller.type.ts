export interface PriceEvent {
    kind: "price-update";
    payload: unknown;
    receivedAt: number;
}

export const CONFIG = {
    wsUrl: "wss://ws.backpack.exchange",
    streamKey: "trading-engine",
    reconnectIntervalMs: 5000, 
    markets: ["BTC_USDC", "SOL_USDC", "ETH_USDC"]
} as const;