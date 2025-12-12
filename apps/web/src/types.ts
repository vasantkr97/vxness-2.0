
export interface User {
  id: string;
  email: string;
  username: string;
}

export interface AuthResponse {
  success: boolean;
  user: User;
  token?: string;
}

export interface Balance {
  symbol: string;
  balanceRaw: string;
  balanceDecimals: number;
}

export interface BalanceResponse {
  userId: string;
  balances: Balance[];
}

export interface Order {
  id: string;
  symbol: string;
  orderType: 'long' | 'short';
  quantity: number | null;
  price: number | null;
  status: 'open' | 'closed';
  pnl: number | null;
  leverage: number;
  takeProfit?: number;
  stopLoss?: number;
  createdAt: string;
  closedAt?: string;
  exitPrice?: number;  // Backend sends exitPrice, not closePrice
  closeReason?: 'TakeProfit' | 'StopLoss' | 'Manual' | 'Liquidation';
}

export interface Candle {
  bucket: number;
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  time: number;
}

export interface CreateOrderRequest {
  asset: 'BTC' | 'ETH' | 'SOL';
  side: 'long' | 'short';
  qty: number;
  leverage: number;
  takeProfit?: number;
  stopLoss?: number;
}

export interface Ticker {
  symbol: string;
  bid: number;
  ask: number;
  change24h: number;
  signal: 'buy' | 'sell' | 'neutral';
  type: 'crypto' | 'forex' | 'stock' | 'index' | 'commodity';
}
