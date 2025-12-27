
import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Hooks
  const { data: balances } = useBalances();
  const { ask: askPrice, bid: bidPrice } = useTicker(asset);
  const createOrder = useCreateOrder();


  const currentPrice = side === 'long' ? askPrice : bidPrice;

  // Derive available balance
  const availableBalance = React.useMemo(() => {
    if (!balances) return 0;
    const usdc = balances.find(b => b.symbol === 'USDC');
    return usdc ? Number(usdc.balanceRaw) / Math.pow(10, usdc.balanceDecimals) : 0;
  }, [balances]);

  // Reset inputs when asset changes
  useEffect(() => {
    setQty('');
    setTakeProfit('');
    setStopLoss('');
    setError(null);
    setSuccess(null);
  }, [asset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const quantity = parseFloat(qty);
    const marginRequired = (quantity * currentPrice) / leverage;

    if (marginRequired > availableBalance) {
      setError(`Insufficient balance. Required: $${marginRequired.toFixed(2)}`);
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
        setSuccess("Order placed successfully");
        setQty('');
        setTakeProfit('');
        setStopLoss('');
        if (onOrderPlaced) onOrderPlaced();
      },
      onError: (err: any) => {
        setError(err.response?.data?.message || "Failed to place order");
      }
    });
  };

  // Calculations
  const quantityNum = parseFloat(qty) || 0;
  const notionalValue = quantityNum * currentPrice;
  const marginRequired = notionalValue / leverage;
  const liquidationPrice = side === 'long'
    ? currentPrice * (1 - 1 / leverage)
    : currentPrice * (1 + 1 / leverage);

  // Validation
  const isInsufficientBalance = marginRequired > availableBalance;
  const isLoading = createOrder.isPending;

  return (
    <div className="bg-dark-800 rounded-xl border border-dark-600/50 p-5 h-full flex flex-col no-scrollbar">
      <h3 className="text-white font-semibold mb-4">Place Order</h3>

      {/* Side Tabs */}
      <div className="flex mb-5 shrink-0">
        <button
          type="button"
          onClick={() => setSide('long')}
          className={`flex-1 py-2.5 rounded-l-lg font-medium transition-colors ${side === 'long' ? 'bg-success text-white' : 'bg-dark-700 text-muted hover:text-white'}`}>
          Long
        </button>
        <button
          type="button"
          onClick={() => setSide('short')}
          className={`flex-1 py-2.5 rounded-r-lg font-medium transition-colors ${side === 'short' ? 'bg-danger text-white' : 'bg-dark-700 text-muted hover:text-white'}`}>
          Short
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        {/* Available Balance Header */}
        <div className="flex justify-between text-xs text-muted mb-2">
          <span>Avail. Balance</span>
          <span className="text-white font-mono">${availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>

        {/* Quantity */}
        <div className="mb-4 shrink-0">
          <Input
            label={`Quantity (${asset})`}
            type="number"
            step="0.001"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            placeholder="0.00"
            required
            className={isInsufficientBalance ? 'border-danger focus:border-danger' : ''}
          />
        </div>

        {/* Leverage Slider */}
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
            className="w-full h-2 rounded-lg appearance-none cursor-pointer leverage-slider"
            style={{
              background: `linear-gradient(to right, #4c94ff 0%, #4c94ff ${((leverage - 1) / 99) * 100}%, #48484fff ${((leverage - 1) / 99) * 100}%, #383840ff 100%)`
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

        {/* TP / SL Inputs */}
        <div className="grid grid-cols-2 gap-3 mb-4 shrink-0">
          <Input
            label="Take Profit"
            type="number"
            step="0.01"
            value={takeProfit}
            onChange={(e) => setTakeProfit(e.target.value)}
            placeholder="Optional"
          />
          <Input
            label="Stop Loss"
            type="number"
            step="0.01"
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
            placeholder="Optional"
          />
        </div>

        {/* Live Order Summary Card */}
        {quantityNum > 0 && (
          <div className="bg-dark-700/50 rounded-lg p-4 mb-4 border border-dark-600/50 animate-in fade-in zoom-in duration-200 shrink-0">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-muted">Market Price</span>
              <span className="text-xs text-white font-mono">${currentPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-muted">Notional Value</span>
              <span className="text-xs text-white font-mono">${notionalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-muted">Liquidation Price (Est.)</span>
              <span className="text-xs text-danger font-mono">${liquidationPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
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
        )}

        {error && <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded text-danger text-sm shrink-0">{error}</div>}
        {success && <div className="mb-4 p-3 bg-success/10 border border-success/20 rounded text-success text-sm shrink-0">{success}</div>}

        <div className="mt-auto">
          <Button
            type="submit"
            fullWidth
            disabled={isLoading || isInsufficientBalance || quantityNum <= 0}
            className={`py-4 text-base shadow-lg border-2 transition-all bg-transparent ${side === 'long'
                ? 'border-success text-success hover:bg-success hover:text-white'
                : 'border-danger text-danger hover:bg-danger hover:text-white'
              }`}
          >
            {isLoading ? 'Processing...' : (
              <div className="flex flex-col items-center leading-tight">
                <span>{side === 'long' ? 'Buy / Long' : 'Sell / Short'} {asset}</span>
                {quantityNum > 0 && (
                  <span className="text-xs opacity-80 font-normal">
                    ~${marginRequired.toLocaleString(undefined, { maximumFractionDigits: 0 })} Margin
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
