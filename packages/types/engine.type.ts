export type Side = "long" | "short"

export interface engineOrder {
    id: string;
    userId: string;
    asset: string;
    side: Side;
    qty: number;
    leverage: number;
    openingPrice: number;
    initialMargin: number;
    takeProfit?: number;
    stopLoss?: number;
    createdAt: number;
}

export type Task = "balance-update" | "order_create" | "order_close"

export interface DBTask {
    type: Task;
    data: any;
}


export const ENGINE_CONSTANTS = {
    PRECISION_SCALE: 100_000_000,
    DB_BATCH_SIZE: 100,
    DB_FLUSH_INTERVAL_MS: 1000,
    MARGIN_THRESHOLD: 0.05,
    MAX_QUEUE_SIZE: 10000,
} as const