
import React, { useState } from 'react';
import { useBalances, useDeposit } from '../hooks/useBalances';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import type { Balance } from '../types';

export const Wallet: React.FC = () => {
  const { data: balances = [] } = useBalances();
  const deposit = useDeposit();

  const [depositAmount, setDepositAmount] = useState('');
  const [selectedAsset, setSelectedAsset] = useState('USDC');

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount) return;

    deposit.mutate({
      symbol: selectedAsset,
      amount: parseFloat(depositAmount)
    }, {
      onSuccess: () => {
        setDepositAmount('');
      }
    });
  };

  const getDisplayBalance = (b: Balance) => {
    return (Number(b.balanceRaw) / Math.pow(10, b.balanceDecimals)).toLocaleString();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Wallet</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Balance List */}
        <div className="bg-dark-800 rounded-xl border border-dark-600/50 p-6">
          <h2 className="text-lg font-semibold mb-4">Assets</h2>
          <div className="space-y-4">
            {balances.length === 0 ? (
              <div className="text-muted text-sm">No balances found.</div>
            ) : (
              balances.map((b) => (
                <div key={b.symbol} className="flex justify-between items-center p-3 bg-dark-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold">
                      {b.symbol[0]}
                    </div>
                    <span className="font-medium">{b.symbol}</span>
                  </div>
                  <div className="font-mono">{getDisplayBalance(b)}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Deposit Form */}
        <div className="bg-dark-800 rounded-xl border border-dark-600/50 p-6 h-fit">
          <h2 className="text-lg font-semibold mb-4">Deposit Funds</h2>
          <form onSubmit={handleDeposit} className="space-y-4">
            <div>
              <label className="text-muted text-sm mb-1.5 block">Asset</label>
              <select
                value={selectedAsset}
                onChange={(e) => setSelectedAsset(e.target.value)}
                className="w-full bg-dark-700 border border-dark-600/50 rounded-lg px-4 py-3 text-white outline-none focus:border-accent/50"
              >
                <option value="USDC">USDC</option>
                <option value="BTC">BTC</option>
                <option value="ETH">ETH</option>
                <option value="SOL">SOL</option>
              </select>
            </div>
            <Input
              label="Amount"
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="0.00"
            />
            <Button fullWidth disabled={deposit.isPending}>
              {deposit.isPending ? 'Processing...' : 'Deposit'}
            </Button>
          </form>
          <p className="text-xs text-muted mt-4">
            * This is a simulation. Funds are added to your virtual wallet balance instantly.
          </p>
        </div>
      </div>
    </div>
  );
};
