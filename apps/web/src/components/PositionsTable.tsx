
import React, { useState } from 'react';
import { useOrders, useCloseOrder } from '../hooks/useOrders';

interface PositionsTableProps {
  // We can optionally pass orders, but the component fetches them now
}

export const PositionsTable: React.FC<PositionsTableProps> = () => {
  const [activeTab, setActiveTab] = useState<'positions' | 'history'>('positions');
  const { data: orders = [] } = useOrders();
  const closeOrder = useCloseOrder();

  const handleClose = (orderId: string) => {
    closeOrder.mutate({ orderId });
  };

  const activeOrders = orders.filter(o => o.status === 'open');
  const historyOrders = orders.filter(o => o.status === 'closed').sort((a,b) => 
    new Date(b.closedAt || 0).getTime() - new Date(a.closedAt || 0).getTime()
  );

  return (
    <div className="bg-dark-800 rounded-xl border border-dark-600/50 overflow-hidden flex flex-col h-full">
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
      
      <div className="overflow-auto flex-1">
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
              (activeTab === 'positions' ? activeOrders : historyOrders).map(order => (
                <tr key={order.id} className="border-b border-dark-600/30 hover:bg-dark-700/50 transition-colors group">
                  <td className="py-3 px-4 font-medium text-white">{order.symbol}</td>
                  <td className={`py-3 px-4 font-medium ${order.orderType === 'long' ? 'text-success' : 'text-danger'}`}>
                    {order.orderType.toUpperCase()}
                  </td>
                  <td className="text-right py-3 px-4 text-muted">{order.leverage}x</td>
                  <td className="text-right py-3 px-4 text-white font-mono">
                    ${order.price?.toLocaleString() ?? '-'}
                  </td>
                  
                  {activeTab === 'history' && (
                    <td className="text-right py-3 px-4 text-white font-mono">
                        ${order.exitPrice?.toLocaleString() || '-'}
                    </td>
                  )}

                  <td className="text-right py-3 px-4 text-white font-mono">
                    {order.quantity?.toFixed(5) ?? '-'}
                  </td>
                  
                  <td className={`text-right py-3 px-4 font-medium font-mono ${(order.pnl ?? 0) >= 0 ? 'text-success' : 'text-danger'}`}>
                    ${(order.pnl ?? 0).toFixed(2)}
                  </td>
                  
                  {activeTab === 'history' && (
                     <td className="text-right py-3 px-4 text-muted text-sm">
                        {order.closedAt ? new Date(order.closedAt).toLocaleDateString() : '-'}
                     </td>
                  )}

                  {activeTab === 'positions' && (
                    <td className="text-right py-3 px-4">
                      <button 
                        onClick={() => handleClose(order.id)}
                        disabled={closeOrder.isPending}
                        className="text-xs bg-dark-600 hover:bg-dark-500 text-white px-3 py-1.5 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50"
                      >
                        {closeOrder.isPending ? '...' : 'Close'}
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
