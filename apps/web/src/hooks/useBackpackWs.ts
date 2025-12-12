import { useEffect, useRef, useState, useCallback } from 'react';

interface TickerData {
  symbol: string;
  bid: number;
  ask: number;
  lastPrice: number;
  change24h: number;
}

interface UseBackpackWsReturn {
  tickers: Record<string, TickerData>;
  isConnected: boolean;
  error: string | null;
}

const BACKPACK_WS_URL = 'wss://ws.backpack.exchange';
const SYMBOLS = ['BTC_USDC', 'ETH_USDC', 'SOL_USDC'];

export const useBackpackWs = (): UseBackpackWsReturn => {
  const [tickers, setTickers] = useState<Record<string, TickerData>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(BACKPACK_WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
        console.log('[WS] Connected to Backpack');
        
        // Subscribe to ticker streams for each symbol
        ws.send(JSON.stringify({
          method: 'SUBSCRIBE',
          params: SYMBOLS.map(s => `ticker.${s}`),
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle ticker updates
          if (data.stream && data.stream.startsWith('ticker.')) {
            const symbol = data.stream.replace('ticker.', '');
            const tickerData = data.data;
            
            // Map symbol to simple name (BTC_USDC -> BTC)
            const simpleSymbol = symbol.replace('_USDC', '');
            
            setTickers(prev => ({
              ...prev,
              [simpleSymbol]: {
                symbol: simpleSymbol,
                bid: parseFloat(tickerData.b || tickerData.bestBid || '0'),
                ask: parseFloat(tickerData.a || tickerData.bestAsk || '0'),
                lastPrice: parseFloat(tickerData.c || tickerData.lastPrice || '0'),
                change24h: parseFloat(tickerData.P || tickerData.priceChangePercent || '0'),
              },
            }));
          }
        } catch (e) {
          console.error('[WS] Failed to parse message:', e);
        }
      };

      ws.onerror = (event) => {
        console.error('[WS] Error:', event);
        setError('WebSocket connection error');
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        console.log('[WS] Disconnected:', event.code, event.reason);
        
        // Reconnect after 5 seconds
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('[WS] Attempting reconnect...');
          connect();
        }, 5000);
      };
    } catch (e) {
      setError('Failed to create WebSocket connection');
      console.error('[WS] Connection failed:', e);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return { tickers, isConnected, error };
};

// Helper hook to get a specific ticker
export const useTicker = (symbol: string) => {
  const { tickers, isConnected, error } = useBackpackWs();
  const ticker = tickers[symbol];
  
  return {
    ticker: ticker || null,
    price: ticker ? ticker.ask : 0, // Default to Ask for buy price estimates
    isConnected,
    error,
  };
};