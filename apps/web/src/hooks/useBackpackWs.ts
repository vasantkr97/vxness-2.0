import { useSyncExternalStore } from 'react';

interface TickerData {
  symbol: string;
  bid: number;
  ask: number;
  lastPrice: number;
  change24h: number;
  updatedAt: number; // Timestamp for detecting changes
}

type TickersState = Record<string, TickerData>;

interface WsState {
  tickers: TickersState;
  isConnected: boolean;
  error: string | null;
}

// Singleton state for WebSocket manager
let ws: WebSocket | null = null;
let tickers: TickersState = {};
let isConnected = false;
let error: string | null = null;
let listeners: Set<() => void> = new Set();

let isConnecting = false;

const WS_URL = 'wss://ws.backpack.exchange';
const SYMBOLS = ['BTC_USDC', 'ETH_USDC', 'SOL_USDC'];
const RECONNECT_DELAY = 3000;

// Cached snapshot for useSyncExternalStore - must be declared before notifyListeners
let cachedSnapshot: WsState = {
  tickers: {},
  isConnected: false,
  error: null,
};

// Notify all listeners of state changes
const notifyListeners = () => {
  // Update cached snapshot before notifying (must be done first!)
  cachedSnapshot = {
    tickers,
    isConnected,
    error,
  };
  listeners.forEach(listener => listener());
};

// Connect to WebSocket
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

      // Subscribe to bookTicker streams for bid/ask prices
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

        // Skip non-data messages
        if (data.id || data.error || !data.stream) {
          if (data.error) {
            console.error('[WS] ❌ Error:', data.error);
            error = data.error.msg || 'WebSocket error';
            notifyListeners();
          }
          return;
        }

        // Handle bookTicker updates
        if (data.stream.startsWith('bookTicker.')) {
          const symbol = data.stream.replace('bookTicker.', '');
          const tickerData = data.data;
          const simpleSymbol = symbol.replace('_USDC', '');

          // Backpack bookTicker fields: b = bid, a = ask
          const bid = parseFloat(tickerData.b || '0');
          const ask = parseFloat(tickerData.a || '0');

          // Calculate change24h if we have previous data
          const prevTicker = tickers[simpleSymbol];
          const lastPrice = ask; // Use ask as current price
          let change24h = prevTicker?.change24h || 0;

          // Approximate change based on bid/ask midpoint movement
          if (prevTicker && prevTicker.lastPrice > 0) {
            const diff = lastPrice - prevTicker.lastPrice;
            change24h = (diff / prevTicker.lastPrice) * 100;
          }

          // Only update if values actually changed (reduces unnecessary re-renders)
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

      // Auto-reconnect
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

// Subscribe to state changes (for useSyncExternalStore)
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};



// Get current state snapshot - returns cached reference
const getSnapshot = (): WsState => {
  return cachedSnapshot;
};

// Server snapshot (for SSR - return stable reference)
const serverSnapshot: WsState = {
  tickers: {},
  isConnected: false,
  error: null,
};

const getServerSnapshot = (): WsState => {
  return serverSnapshot;
};

// Initialize connection on first import
connect();

interface UseBackpackWsReturn {
  tickers: TickersState;
  isConnected: boolean;
  error: string | null;
}

export const useBackpackWs = (): UseBackpackWsReturn => {
  // useSyncExternalStore is React 18's recommended way to subscribe to external stores
  // It handles concurrent rendering better than useState + useEffect
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return state;
};

// Helper hook to get a specific ticker price with granular subscription
export const useTicker = (symbol: string) => {
  // Subscribe specifically to the ticker for this symbol
  const ticker = useSyncExternalStore(subscribe, () => cachedSnapshot.tickers[symbol]);
  const isConnected = useSyncExternalStore(subscribe, () => cachedSnapshot.isConnected);
  const error = useSyncExternalStore(subscribe, () => cachedSnapshot.error);

  return {
    ticker: ticker || null,
    price: ticker ? ticker.ask : 0,
    bid: ticker ? ticker.bid : 0,
    isConnected,
    error,
    updatedAt: ticker?.updatedAt || 0,
  };
};
