export const ORDER_PRECISION = {
    PRICE: 100,
    QUANTITY: 10000000
} as const;

// Define correct decimals for each cryptocurrency
export const SYMBOL_DECIMALS = {
    BTC: 8,   // Bitcoin: 1 BTC = 100,000,000 satoshis
    ETH: 18,  // Ethereum: 1 ETH = 1,000,000,000,000,000,000 wei
    SOL: 9,   // Solana: 1 SOL = 1,000,000,000 lamports
    USDC: 6,  // USDC: 1 USDC = 1,000,000 micro-units
} as const;

export type Symbol = keyof typeof SYMBOL_DECIMALS;


export const REDIS_ENGINE_CONSTANTS = {
    CALLBACK_QUEUE: "callback-queue",
    REQUEST_STREAM_KEY: "trading-engine",
    RETRY_DELAY_MS: 5000,
    POLLING_TIMEOUT: 0
} as const

