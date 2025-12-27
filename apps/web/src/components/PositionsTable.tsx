
import React, { useState, useEffect, useRef, memo } from 'react';
import { useOrders, useCloseOrder } from '../hooks/useOrders';
import { useTicker } from '../hooks/useBackpackWs';
import type { Order } from '../types';

interface PositionsTableProps {}

// Component for displaying PNL with flash animation
// Now integrated into PositionRow for better control, but kept as helper for history/static views if needed
const PnlValue: React.FC<{ value: number; flashState: 'up' | 'down' | null }> = ({ value, flashState }) => {
  const isPositive = value >= 0;
  let bgClass = '';
  if (flashState === 'up') bgClass = 'bg-green-500/20 text-green-100'; // Brighter flash for up
  if (flashState === 'down') bgClass = 'bg-red-500/20 text-red-100';   // Brighter flash for down

  return (
    <span className={`px-2 py-1 rounded transition-colors duration-300 ${bgClass} ${flashState ? '' : (isPositive ? 'text-success' : 'text-danger')}`}>
      ${value.toFixed(2)}
    </span>
  );
};

interface PositionRowProps {
  order: Order;
  onClose: (orderId: string) => void;
  isClosing: boolean;
}

// Memoized Row Component for Active Positions
const PositionRow = memo(({ order, onClose, isClosing }: PositionRowProps) => {
  const { price: currentPrice, bid } = useTicker(order.symbol);
  const [flashState, setFlashState] = useState<'up' | 'down' | null>(null);
  const prevPnlRef = useRef<number | null>(null);

  // Calculate Live PNL
  const calculatePnl = () => {
    if (!currentPrice || !order.price || !order.quantity) return order.pnl ?? 0;
    
    // For Long: Exit at Bid
    // For Short: Exit at Ask (using currentPrice which is often mapped to Ask or Last)
    // To be precise: Long exits at Bid, Short exits at Ask. 
    // The useTicker hook returns 'price' (ask) and 'bid'.
    
    // Default to 'price' (Ask) if Bid not available, but for correctness:
    const exitPrice = order.orderType === 'long' ? bid : currentPrice;
    
    const priceDiff = order.orderType === 'long' 
      ? exitPrice - order.price 
      : order.price - exitPrice;
    
    return priceDiff * order.quantity;
  };

  const livePnl = calculatePnl();

  // Handle Flashing
  useEffect(() => {
    if (prevPnlRef.current !== null) {
      const diff = livePnl - prevPnlRef.current;
      if (Math.abs(diff) > 0.00001) { // Sensitivity logic
        if (diff > 0) {
          setFlashState('up');
        } else if (diff < 0) {
          setFlashState('down');
        }
        
        const timer = setTimeout(() => setFlashState(null), 300); // 300ms flash
        return () => clearTimeout(timer);
      }
    }
    prevPnlRef.current = livePnl;
  }, [livePnl]);

  return (
    <tr className="border-b border-dark-600/30 hover:bg-dark-700/50 transition-colors group">
      <td className="py-3 px-4 font-medium text-white">{order.symbol}</td>
      <td className={`py-3 px-4 font-medium ${order.orderType === 'long' ? 'text-success' : 'text-danger'}`}>
        {order.orderType.toUpperCase()}
      </td>
      <td className="text-right py-3 px-4 text-muted">{order.leverage}x</td>
      <td className="text-right py-3 px-4 text-white font-mono">
        ${order.price?.toLocaleString() ?? '-'}
      </td>
      <td className="text-right py-3 px-4 text-white font-mono">
        {order.quantity?.toFixed(5) ?? '-'}
      </td>
      <td className="text-right py-3 px-4 font-medium font-mono">
        <PnlValue value={livePnl} flashState={flashState} />
      </td>
      <td className="text-right py-3 px-4">
        <button 
          onClick={() => onClose(order.id)}
          disabled={isClosing}
          className={`text-xs px-3 py-1.5 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 ${
            isClosing 
              ? 'bg-yellow-600/50 text-yellow-200 cursor-wait' 
              : 'bg-dark-600 hover:bg-dark-500 text-white'
          } disabled:opacity-50`}
        >
          {isClosing ? 'Closing...' : 'Close'}
        </button>
      </td>
    </tr>
  );
});

export const PositionsTable: React.FC<PositionsTableProps> = () => {
  const [activeTab, setActiveTab] = useState<'positions' | 'history'>('positions');
  const [closingOrderId, setClosingOrderId] = useState<string | null>(null);
  const [closeError, setCloseError] = useState<string | null>(null);
  const { data: orders = [] } = useOrders();
  const closeOrder = useCloseOrder();

  const handleClose = (orderId: string) => {
    setClosingOrderId(orderId);
    setCloseError(null);
    closeOrder.mutate(
      { orderId },
      {
        onSuccess: () => {
          setClosingOrderId(null);
        },
        onError: (error: Error) => {
          setClosingOrderId(null);
          setCloseError(`Failed to close order: ${error.message}`);
          setTimeout(() => setCloseError(null), 5000);
        },
      }
    );
  };

  const activeOrders = orders.filter(o => o.status === 'open');
  const historyOrders = orders.filter(o => o.status === 'closed').sort((a,b) => 
    new Date(b.closedAt || 0).getTime() - new Date(a.closedAt || 0).getTime()
  );

  return (
    <div className="bg-dark-800 rounded-xl border border-dark-600/50 overflow-hidden flex flex-col h-full">
      {/* Error Banner */}
      {closeError && (
        <div className="bg-danger/20 border-b border-danger/30 px-4 py-2 text-danger text-sm flex justify-between items-center">
          <span>{closeError}</span>
          <button onClick={() => setCloseError(null)} className="text-danger hover:text-white">✕</button>
        </div>
      )}
      
      {/* Tabs */}
      <div className="flex border-b border-dark-600/50 bg-dark-800">
          <button 
             onClick={() => setActiveTab('positions')}
             className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'positions' ? 'border-accent text-white' : 'border-transparent text-muted hover:text-white'}`}
          >
             Open Positions ({activeOrders.length})
          </button>
          <button 
             onClick={() => setActiveTab('history')}
             className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'history' ? 'border-accent text-white' : 'border-transparent text-muted hover:text-white'}`}
          >
             Order History
          </button>
      </div>
      
      <div className="overflow-auto flex-1 no-scrollbar">
        <table className="w-full relative">
          <thead className="sticky top-0 bg-dark-800 z-10 shadow-sm">
            <tr className="text-muted text-xs uppercase tracking-wider border-b border-dark-600/50">
              <th className="text-left py-3 px-4 font-medium">Symbol</th>
              <th className="text-left py-3 px-4 font-medium">Side</th>
              <th className="text-right py-3 px-4 font-medium">Leverage</th>
              <th className="text-right py-3 px-4 font-medium">Entry Price</th>
              {activeTab === 'history' && <th className="text-right py-3 px-4 font-medium">Close Price</th>}
              <th className="text-right py-3 px-4 font-medium">Qty</th>
              <th className="text-right py-3 px-4 font-medium">PnL</th>
              {activeTab === 'history' && <th className="text-right py-3 px-4 font-medium">Closed At</th>}
              {activeTab === 'positions' && <th className="text-right py-3 px-4 font-medium">Action</th>}
            </tr>
          </thead>
          <tbody>
            {(activeTab === 'positions' ? activeOrders : historyOrders).length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-muted">
                   {activeTab === 'positions' ? 'No open positions' : 'No order history'}
                </td>
              </tr>
            ) : (
                activeTab === 'positions' ? (
                  activeOrders.map(order => (
                    <PositionRow 
                      key={order.id} 
                      order={order} 
                      onClose={handleClose} 
                      isClosing={closingOrderId === order.id} 
                    />
                  ))
                ) : (
                  historyOrders.map(order => (
                    <tr key={order.id} className="border-b border-dark-600/30 hover:bg-dark-700/50 transition-colors">
                      <td className="py-3 px-4 font-medium text-white">{order.symbol}</td>
                      <td className={`py-3 px-4 font-medium ${order.orderType === 'long' ? 'text-success' : 'text-danger'}`}>
                        {order.orderType.toUpperCase()}
                      </td>
                      <td className="text-right py-3 px-4 text-muted">{order.leverage}x</td>
                      <td className="text-right py-3 px-4 text-white font-mono">
                        ${order.price?.toLocaleString() ?? '-'}
                      </td>
                      <td className="text-right py-3 px-4 text-white font-mono">
                        ${order.exitPrice?.toLocaleString() || '-'}
                      </td>
                      <td className="text-right py-3 px-4 text-white font-mono">
                        {order.quantity?.toFixed(5) ?? '-'}
                      </td>
                      <td className="text-right py-3 px-4 font-medium font-mono">
                         <span className={order.pnl && order.pnl >= 0 ? 'text-success' : 'text-danger'}>
                           ${order.pnl?.toFixed(2) ?? '0.00'}
                         </span>
                      </td>
                      <td className="text-right py-3 px-4 text-muted text-sm">
                        {order.closedAt ? new Date(order.closedAt).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  ))
                )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
