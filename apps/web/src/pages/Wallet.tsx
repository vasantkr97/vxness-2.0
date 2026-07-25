
import React, { useState } from 'react';
import { useBalances, useDeposit } from '../hooks/useBalances';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export const Wallet: React.FC = () => {
  const { data: balances = [] } = useBalances();
  const deposit = useDeposit();

  const [depositAmount, setDepositAmount] = useState('');
  const usdcBalance = balances.find((balance) => balance.symbol === 'USDC');

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount) return;

    deposit.mutate({
      symbol: 'USDC',
      amount: parseFloat(depositAmount)
    }, {
      onSuccess: () => {
        setDepositAmount('');
      }
    });
  };

  const displayBalance = usdcBalance
    ? (Number(usdcBalance.balanceRaw) / Math.pow(10, usdcBalance.balanceDecimals)).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : '0.00';

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Trading collateral</h1>
      <p className="text-sm text-muted mb-6">USDC is used for margin, realized PnL, and available trading balance.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div className="bg-dark-800 rounded-xl border border-dark-600/50 p-6">
          <h2 className="text-lg font-semibold mb-4">Available balance</h2>
          <div className="flex justify-between items-center p-4 bg-dark-700/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold">
                $
              </div>
              <div>
                <div className="font-medium">USDC</div>
                <div className="text-xs text-muted">Trading collateral</div>
              </div>
            </div>
            <div className="font-mono text-lg">{displayBalance}</div>
          </div>
        </div>

        <div className="bg-dark-800 rounded-xl border border-dark-600/50 p-6 h-fit">
          <h2 className="text-lg font-semibold mb-1">Add demo funds</h2>
          <p className="text-xs text-muted mb-4">Increase your simulated USDC collateral balance.</p>
          <form onSubmit={handleDeposit} className="space-y-4">
            <div>
              <div className="text-sm font-medium text-gray-300 mb-1.5">Asset</div>
              <div className="h-10 px-3 flex items-center justify-between rounded-lg border border-dark-600 bg-dark-700/50">
                <span className="text-sm">USD Coin</span>
                <span className="font-mono text-xs text-accent">USDC</span>
              </div>
            </div>
            <Input
              label="Amount"
              type="number"
              min="0.01"
              step="0.01"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="0.00"
            />
            <Button fullWidth disabled={deposit.isPending}>
              {deposit.isPending ? 'Processing...' : 'Deposit'}
            </Button>
          </form>
          <p className="text-xs text-muted mt-4">
            This is a simulation. Demo USDC is added instantly and has no real-world value.
          </p>
        </div>
      </div>
    </div>
  );
};
