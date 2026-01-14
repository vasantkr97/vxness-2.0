
import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useToast } from '../context/ToastContext';
import { useCreateOrder } from '../hooks/useOrders';
import { useTicker } from '../hooks/useBackpackWs';
import { useBalances } from '../hooks/useBalances';

interface OrderFormProps {
  asset: 'BTC' | 'ETH' | 'SOL';
  onOrderPlaced?: () => void;
}

export const OrderForm: React.FC<OrderFormProps> = ({ asset, onOrderPlaced }) => {
  const [side, setSide] = useState<'long' | 'short'>('long');
  const [qty, setQty] = useState<string>('');
  const [leverage, setLeverage] = useState<number>(1);
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [stopLoss, setStopLoss] = useState<string>('');

  const { showToast } = useToast();


  const { data: balances } = useBalances();
  const { ask: askPrice, bid: bidPrice } = useTicker(asset);
  const createOrder = useCreateOrder();


  const currentPrice = side === 'long' ? askPrice : bidPrice;

  const availableBalance = React.useMemo(() => {
    if (!balances) return 0;
    const usdc = balances.find(b => b.symbol === 'USDC');
    return usdc ? Number(usdc.balanceRaw) / Math.pow(10, usdc.balanceDecimals) : 0;
  }, [balances]);

  useEffect(() => {
    setQty('');
    setTakeProfit('');
    setStopLoss('');
  }, [asset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const quantity = parseFloat(qty);
    const marginRequired = (quantity * currentPrice) / leverage;

    if (marginRequired > availableBalance) {
      showToast(`Insufficient balance. Required: $${marginRequired.toFixed(2)}`, 'error');
      return;
    }

    createOrder.mutate({
      asset,
      side,
      qty: quantity,
      leverage,
      takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
      stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
    }, {
      onSuccess: () => {
        const orderType = side.toUpperCase();
        showToast(`${orderType} ${quantity} ${asset} Order Placed Successfully`, 'success');
        setQty('');
        setTakeProfit('');
        setStopLoss('');
        if (onOrderPlaced) onOrderPlaced();
      },
      onError: (err: any) => {
        const msg = err.response?.data?.message || "Failed to place order";
        showToast(msg, 'error');
      }
    });
  };

  const quantityNum = parseFloat(qty) || 0;
  const notionalValue = quantityNum * currentPrice;
  const marginRequired = notionalValue / leverage;
  const liquidationPrice = (quantityNum > 0 && currentPrice)
    ? (side === 'long'
      ? currentPrice * (1 - 1 / leverage)
      : currentPrice * (1 + 1 / leverage))
    : 0;

  const isInsufficientBalance = marginRequired > availableBalance;
  const isLoading = createOrder.isPending;

  return (
    <div className="bg-dark-800 rounded-xl border border-dark-600/50 p-5 flex flex-col no-scrollbar">
      <div className="flex justify-between items-center mb-4">
        <span className="text-muted text-sm">{asset}</span>
        <span className="text-white font-semibold text-lg font-mono">${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>

      <div className="flex mb-4 shrink-0">
        <button
          type="button"
          onClick={() => setSide('long')}
          className={`flex-1 py-2.5 rounded-l-lg font-medium transition-colors ${side === 'long' ? 'bg-success text-white' : 'bg-dark-700 text-muted hover:text-white'}`}>
          Buy
        </button>
        <button
          type="button"
          onClick={() => setSide('short')}
          className={`flex-1 py-2.5 rounded-r-lg font-medium transition-colors ${side === 'short' ? 'bg-danger text-white' : 'bg-dark-700 text-muted hover:text-white'}`}>
          Sell
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">

        <div className="mb-[12px] shrink-0">
          <Input
            label={`Quantity (${asset})`}
            type="number"
            step="0.001"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            placeholder="0.00"
            required
            className={`py-2 text-sm ${isInsufficientBalance ? 'border-danger focus:border-danger' : ''}`}
          />
        </div>

        <div className="mb-4 shrink-0">
          <label className="text-muted text-sm mb-2 flex justify-between">
            <span>Leverage</span>
            <span className="text-white font-mono">{leverage}x</span>
          </label>
          <input
            type="range"
            min="1"
            max="100"
            value={leverage}
            onChange={(e) => setLeverage(parseInt(e.target.value))}
            className="w-full h-1 rounded-lg appearance-none cursor-pointer leverage-slider"
            style={{
              background: `linear-gradient(to right, #6b7280 0%, #6b7280 ${((leverage - 1) / 99) * 100}%, #2d2d30 ${((leverage - 1) / 99) * 100}%, #2d2d30 100%)`,
              accentColor: '#9ca3af'
            }}
          />
          <div className="flex justify-between text-xs text-muted mt-1">
            <span>1x</span>
            <span>25x</span>
            <span>50x</span>
            <span>75x</span>
            <span>100x</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4 shrink-0">
          <Input
            label="Take Profit"
            type="number"
            step="0.01"
            value={takeProfit}
            onChange={(e) => setTakeProfit(e.target.value)}
            placeholder="Optional"
            className="py-2 px-2 text-xs"
          />
          <Input
            label="Stop Loss"
            type="number"
            step="0.01"
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
            placeholder="Optional"
            className="py-2 px-2 text-xs"
          />
        </div>

        <div className="bg-dark-700/50 rounded-lg p-4 mb-4 border border-dark-600/50 animate-in fade-in zoom-in duration-200 shrink-0">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-muted">Market Price</span>
            <span className="text-xs text-white font-mono">${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-muted">Notional Value</span>
            <span className="text-xs text-white font-mono">${notionalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-muted">Liquidation Price (Est.)</span>
            <span className="text-xs text-danger font-mono">${liquidationPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="h-px bg-dark-600/50 my-2"></div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted">Margin Required</span>
            <div className="text-right">
              <span className={`text-sm font-semibold font-mono ${isInsufficientBalance ? 'text-danger' : 'text-white'}`}>
                ${marginRequired.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              {isInsufficientBalance && (
                <div className="text-[10px] text-danger mt-0.5">Insufficient Balance</div>
              )}
            </div>
          </div>
        </div>



        <div className="mt-auto">
          <Button
            type="submit"
            fullWidth
            disabled={isLoading || isInsufficientBalance || quantityNum <= 0}
            className={`py-3 px-2 text-sm shadow-lg border-2 transition-all bg-transparent h-auto min-h-[3.5rem] whitespace-normal break-words ${side === 'long'
              ? 'border-success text-success hover:bg-success hover:text-white'
              : 'border-danger text-danger hover:bg-danger hover:text-white'
              }`}
          >
            {isLoading ? 'Processing...' : (
              <div className="flex flex-col items-center leading-tight w-full">
                <span className="text-center">{side === 'long' ? 'Buy' : 'Sell'} {asset}</span>
                {quantityNum > 0 && (
                  <span className="text-xs opacity-80 font-normal mt-1">
                    ~${marginRequired.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Margin
                  </span>
                )}
              </div>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
