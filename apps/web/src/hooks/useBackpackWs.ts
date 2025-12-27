import { useSyncExternalStore } from 'react';

interface TickerData {
  symbol: string;
  bid: number;
  ask: number;
  lastPrice: number;
  change24h: number;
  updatedAt: number;
}

type TickersState = Record<string, TickerData>;

interface WsState {
  tickers: TickersState;
  isConnected: boolean;
  error: string | null;
}

let ws: WebSocket | null = null;
let tickers: TickersState = {};
let isConnected = false;
let error: string | null = null;
let listeners: Set<() => void> = new Set();

let isConnecting = false;

const WS_URL = 'wss://ws.backpack.exchange';
const SYMBOLS = ['BTC_USDC', 'ETH_USDC', 'SOL_USDC'];
const RECONNECT_DELAY = 3000;

let cachedSnapshot: WsState = {
  tickers: {},
  isConnected: false,
  error: null,
};

const notifyListeners = () => {
  cachedSnapshot = {
    tickers,
    isConnected,
    error,
  };
  listeners.forEach(listener => listener());
};

const connect = () => {
  if (isConnecting || (ws && ws.readyState === WebSocket.OPEN)) {
    return;
  }

  isConnecting = true;
  console.log('[WS] Connecting to Backpack...');

  try {
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      isConnecting = false;
      isConnected = true;
      error = null;
      console.log('[WS] ✓ Connected to Backpack successfully');
      notifyListeners();

      setTimeout(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          const bookTickerStreams = SYMBOLS.map(s => `bookTicker.${s}`);
          ws.send(JSON.stringify({
            method: 'SUBSCRIBE',
            params: bookTickerStreams,
          }));
          console.log(`[WS] Subscribed to ${bookTickerStreams.length} bookTicker streams`);
        }
      }, 500);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.id || data.error || !data.stream) {
          if (data.error) {
            console.error('[WS] Error:', data.error);
            error = data.error.msg || 'WebSocket error';
            notifyListeners();
          }
          return;
        }

        if (data.stream.startsWith('bookTicker.')) {
          const symbol = data.stream.replace('bookTicker.', '');
          const tickerData = data.data;
          const simpleSymbol = symbol.replace('_USDC', '');
          const bid = parseFloat(tickerData.b || '0');
          const ask = parseFloat(tickerData.a || '0');

          const prevTicker = tickers[simpleSymbol];
          const lastPrice = ask;
          let change24h = prevTicker?.change24h || 0;
          if (prevTicker && prevTicker.lastPrice > 0) {
            const diff = lastPrice - prevTicker.lastPrice;
            change24h = (diff / prevTicker.lastPrice) * 100;
          }

          const hasChanged = !prevTicker || 
            prevTicker.bid !== bid || 
            prevTicker.ask !== ask;

          if (hasChanged) {
            tickers = {
              ...tickers,
              [simpleSymbol]: {
                symbol: simpleSymbol,
                bid,
                ask,
                lastPrice,
                change24h,
                updatedAt: Date.now(),
              },
            };
            notifyListeners();
          }
        }
      } catch (e) {
        console.error('[WS] Failed to parse message:', e);
      }
    };

    ws.onclose = (event) => {
      isConnecting = false;
      isConnected = false;
      console.log(`[WS] Disconnected: code=${event.code}`);
      notifyListeners();

      setTimeout(() => {
        connect();
      }, RECONNECT_DELAY);
    };

    ws.onerror = () => {
      isConnecting = false;
      isConnected = false;
      error = 'WebSocket connection error';
      console.error('[WS] ✗ Connection error');
      notifyListeners();
    };
  } catch (e) {
    isConnecting = false;
    error = 'Failed to connect';
    console.error('[WS] Failed to create connection:', e);
    notifyListeners();

    setTimeout(() => {
      connect();
    }, RECONNECT_DELAY);
  }
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = (): WsState => {
  return cachedSnapshot;
};
const serverSnapshot: WsState = {
  tickers: {},
  isConnected: false,
  error: null,
};

const getServerSnapshot = (): WsState => {
  return serverSnapshot;
};

connect();

interface UseBackpackWsReturn {
  tickers: TickersState;
  isConnected: boolean;
  error: string | null;
}

export const useBackpackWs = (): UseBackpackWsReturn => {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return state;
};

export const useTicker = (symbol: string) => {
  
  const ticker = useSyncExternalStore(subscribe, () => cachedSnapshot.tickers[symbol]);
  const isConnected = useSyncExternalStore(subscribe, () => cachedSnapshot.isConnected);
  const error = useSyncExternalStore(subscribe, () => cachedSnapshot.error);

  return {
    ticker: ticker || null,
    ask: ticker ? ticker.ask : 0,
    bid: ticker ? ticker.bid : 0,
    isConnected,
    error,
    updatedAt: ticker?.updatedAt || 0,
  };
};
