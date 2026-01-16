
import React, { useState, memo } from 'react';
import { useOrders, useCloseOrder } from '../hooks/useOrders';
import { useTicker } from '../hooks/useBackpackWs';
import type { Order } from '../types';
import { SYMBOL_DECIMALS } from '@vxness/types';

interface PositionsTableProps { }

const PnlValue: React.FC<{ value: number }> = ({ value }) => {
  const isPositive = value >= 0;

  return (
    <span className={`font-mono py-0.5 rounded ${isPositive ? 'text-success' : 'text-danger'}`}>
      ${value.toFixed(2)}
    </span>
  );
};

interface PositionRowProps {
  order: Order;
  onClose: (orderId: string) => void;
  isClosing: boolean;
}


const PositionRow = memo(({ order, onClose, isClosing }: PositionRowProps) => {

  const { ask: currentPrice, bid } = useTicker(order.symbol);

  // Define decimals map to handle normalization correctly
  // const SYMBOL_DECIMALS ... removed

  const stats = React.useMemo(() => {
    // Determine decimals: Try map first, then order property, then fallback to 8 (safer for crypto) or 4
    const decimals = order.quantityDecimals ?? SYMBOL_DECIMALS[order.symbol as keyof typeof SYMBOL_DECIMALS] ?? 8;
    const qty = order.quantity ? Number(order.quantity) / Math.pow(10, decimals) : 0;
    
    return { qty, decimals };
  }, [order.quantity, order.quantityDecimals, order.symbol]);


  const calculatePnl = () => {
    if (!currentPrice || !order.price || !stats.qty) return order.pnl ?? 0;

    const exitPrice = order.orderType === 'long' ? bid : currentPrice;

    const priceDiff = order.orderType === 'long'
      ? exitPrice - order.price
      : order.price - exitPrice;

    return priceDiff * stats.qty;
  };

  const livePnl = calculatePnl();



  return (
    <tr className="border-b border-dark-600/30 hover:bg-dark-700/50 transition-colors group">
      <td className="py-3 px-4 font-medium text-white">{order.symbol}</td>
      <td className={`py-3 px-4 font-medium ${order.orderType === 'long' ? 'text-success' : 'text-danger'}`}>
        {order.orderType === 'long' ? 'Buy' : 'Sell'}
      </td>
      <td className="text-right py-3 px-4 text-muted">{order.leverage}x</td>
      <td className="text-right py-3 px-4 text-gray-300 font-mono">
        ${order.price?.toLocaleString() ?? '-'}
      </td>
      <td className="text-right py-3 px-4 text-gray-300 font-mono">
        {stats.qty?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: stats.decimals }) ?? '-'}
      </td>
      <td className="text-right py-3 px-4 font-medium">
        <PnlValue value={livePnl} />
      </td>
      <td className="text-right py-3 px-4">
        <button
          onClick={() => onClose(order.id)}
          disabled={isClosing}
          className={`text-xs px-3 py-1.5 rounded transition-colors ${isClosing
            ? 'bg-slate-600/50 text-slate-200 cursor-wait'
            : 'bg-red-500 hover:bg-red-600 text-white'
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
  const historyOrders = orders.filter(o => o.status === 'closed').sort((a, b) =>
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
          className={`px-6 py-4 text-sm font-medium transition-colors border-b ${activeTab === 'positions' ? 'border-accent text-white' : 'border-transparent text-muted hover:text-white'}`}
        >
          Open Positions ({activeOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-6 py-4 text-sm font-medium transition-colors border-b ${activeTab === 'history' ? 'border-accent text-white' : 'border-transparent text-muted hover:text-white'}`}
        >
          Order History
        </button>
      </div>

      <div className="overflow-auto flex-1 no-scrollbar">
        <table className="w-full relative">
          <thead className="sticky top-0 bg-dark-800 z-10 shadow-sm">
            <tr className="text-muted text-xs tracking-wider border-b border-dark-600/50">
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
                      {order.orderType === 'long' ? 'Buy' : 'Sell'}
                    </td>
                    <td className="text-right py-3 px-4 text-muted">{order.leverage}x</td>
                    <td className="text-right py-3 px-4 text-gray-300 font-mono">
                      ${order.price?.toLocaleString() ?? '-'}
                    </td>
                    <td className="text-right py-3 px-4 text-gray-300 font-mono">
                      ${order.exitPrice?.toLocaleString() || '-'}
                    </td>
                    <td className="text-right py-3 px-4 text-gray-300 font-mono">
                      {(() => {
                        const decimals = order.quantityDecimals ?? SYMBOL_DECIMALS[order.symbol as keyof typeof SYMBOL_DECIMALS] ?? 8;
                        return (order.quantity ? Number(order.quantity) / Math.pow(10, decimals) : 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: decimals });
                      })() ?? '-'}
                    </td>
                    <td className="text-right py-3 px-4 font-medium">
                      <span className={`font-mono py-0.5 rounded ${order.pnl && order.pnl >= 0 ? 'text-success' : 'text-danger'}`}>
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
