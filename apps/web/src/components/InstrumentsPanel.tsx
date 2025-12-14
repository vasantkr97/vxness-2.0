
import React, { useState, useEffect, useRef } from 'react';
import { useBackpackWs } from '../hooks/useBackpackWs';

interface InstrumentsPanelProps {
  currentAsset: string;
  onSelectAsset: (asset: string) => void;
  className?: string;
}

// Component for displaying price with flash animation
const FlashPrice: React.FC<{ value: number; className?: string; updatedAt?: number }> = ({ 
  value, 
  className = '',
  updatedAt = 0
}) => {
  const [flash, setFlash] = useState(false);
  const prevValueRef = useRef(value);
  
  useEffect(() => {
    if (prevValueRef.current !== value && prevValueRef.current > 0) {
      setFlash(true);
      const timer = setTimeout(() => setFlash(false), 300);
      prevValueRef.current = value;
      return () => clearTimeout(timer);
    }
    prevValueRef.current = value;
  }, [value, updatedAt]);

  return (
    <span 
      className={`${className} transition-colors duration-150 ${flash ? 'text-yellow-400' : ''}`}
    >
      {value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
    </span>
  );
};

export const InstrumentsPanel: React.FC<InstrumentsPanelProps> = ({ currentAsset, onSelectAsset, className = '' }) => {
  const [search, setSearch] = useState('');
  const { tickers, isConnected } = useBackpackWs();

  const tickerList = Object.values(tickers);
  
  // If no WS data yet, fallback to static list or empty
  const displayTickers = tickerList.length > 0 ? tickerList : [];
  const filteredTickers = displayTickers.filter(t => 
    t.symbol.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`bg-dark-800 border-r border-dark-600/50 flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-dark-600/50">
        <div className="flex justify-between items-center mb-3">
            <h3 className="text-white font-semibold">INSTRUMENTS</h3>
            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-success shadow-lg shadow-success/50' : 'bg-danger'}`} title={isConnected ? 'Connected' : 'Disconnected'} />
        </div>
        <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-3 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
                type="text" 
                placeholder="Search" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-dark-700 border border-dark-600/50 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-muted focus:border-accent/50 focus:outline-none"
            />
        </div>
      </div>

      <div className="grid grid-cols-[34%_33%_33%] px-4 py-2 text-xs text-muted uppercase font-medium">
          <div>Symbol</div>
          <div className="text-right">Bid</div>
          <div className="text-right">Ask</div>
      </div>

      <div className="flex-1 overflow-y-auto">
          {displayTickers.length === 0 ? (
             <div className="p-4 text-center text-muted text-sm">
                {isConnected ? 'Waiting for data...' : 'Connecting to market...'}
             </div>
          ) : (
            filteredTickers.map(ticker => {
                const isSelected = currentAsset === ticker.symbol || currentAsset.startsWith(ticker.symbol);
                const signal = ticker.change24h > 0 ? 'buy' : ticker.change24h < 0 ? 'sell' : 'neutral';
                
                return (
                    <div 
                        key={ticker.symbol}
                        onClick={() => onSelectAsset(ticker.symbol)}
                        className={`grid grid-cols-[34%_33%_33%] px-4 py-3 cursor-pointer transition-colors border-b border-dark-600/20 hover:bg-dark-700 ${isSelected ? 'bg-dark-700/80 border-l-2 border-l-accent' : ''}`}
                    >
                        <div className="flex items-center gap-2 overflow-hidden">
                             <div className="w-2 h-2 rounded-full bg-dark-600 flex-shrink-0"></div>
                             <div className="flex flex-col min-w-0">
                                <span className={`text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-gray-300'}`}>{ticker.symbol}</span>
                                <div className="flex items-center gap-1">
                                    <span className={`text-[10px] ${signal === 'buy' ? 'bg-success/20 text-success' : signal === 'sell' ? 'bg-danger/20 text-danger' : 'bg-gray-700 text-gray-400'} px-1 rounded`}>
                                        {signal === 'buy' ? '↑' : signal === 'sell' ? '↓' : '-'} {Math.abs(ticker.change24h).toFixed(2)}%
                                    </span>
                                </div>
                             </div>
                        </div>
                        <div className={`text-right text-sm font-mono whitespace-nowrap flex items-center justify-end ${ticker.change24h >= 0 ? 'text-success' : 'text-danger'}`}>
                            <FlashPrice value={ticker.bid} updatedAt={ticker.updatedAt} />
                        </div>
                        <div className="text-right text-sm font-mono whitespace-nowrap flex items-center justify-end text-muted">
                            <FlashPrice value={ticker.ask} updatedAt={ticker.updatedAt} />
                        </div>
                    </div>
                );
            })
          )}
      </div>
    </div>
  );
};
