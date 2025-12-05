import type { UserBalance } from "./user.type";

export interface Order {
    id: string;
    userId: string;
    asset: string;
    side: "buy" | "sell" | "long" | "short";
    qty: number;
    leverage?: number;
    openingPrice: number;
    closingPrice: number | Date;
    createdAt: number | Date;
    status: "open" | "closed";
    takeProfit?: number;
    stopLoss?: number;
    pnl?: number;
    closeReason?: "TakeProfit" | "StopLoss" | "Manual" | "Liquidation" | "margin";
}


export interface CreateOrderPayload {
    id: string;
    userId: string;
    asset: string;
    side: "buy" | "sell";
    qty: number;
    leverage?: number;
    takeProfit?: number;
    stopLoss?: number;
    balanceSnapshot: UserBalance[];
    enqueuedAt: number;
}

export interface PriceData {
    symbol: string; //symbol
    bidPrice: string //bid Price
    askPrice: string //ask Price
}


export interface EngineMessage {
    kind: "price-update" | "create-order" | "close-order" | "balance-update";
    payload: any;
}

export interface CloseOrderPayload {
    orderId: string;
    userId: string;
    closeReason?: "TakeProfit" | "Stoploss" | "Manual" | "Liquidation";
    pnl?: number;
    closedAt: number;
}

// Engine callback types - responses from trading engine via Redis
export type EngineCallbackStatus =
    | "created"              // Order successfully created
    | "closed"               // Order closed (manual, TP, SL, or liquidation)
    | "insufficient_balance" // Not enough USDC to open position
    | "no_price"             // No price data available for asset
    | "invalid_order"        // Missing or invalid order fields
    | "invalid_close_request"// Missing orderId or userId for close
    | "order_not_found";     // Order doesn't exist or doesn't belong to user

export type CloseReason = "TakeProfit" | "StopLoss" | "margin" | "Manual";

export interface EngineCallback {
    id: string;                  // The correlation/order ID
    status: EngineCallbackStatus;
    reason?: CloseReason;        // Only present when status === "closed"
    pnl?: string;                // Only present when status === "closed" (as string from Redis)
}