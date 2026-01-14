
import React, { useState } from 'react';
import { useBalances, useDeposit } from '../hooks/useBalances';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
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
    const balance = Number(b.balanceRaw) / Math.pow(10, b.balanceDecimals);
    
    // Show 2 decimals for USDC and SOL
    if (b.symbol === 'USDC' || b.symbol === 'SOL') {
      return balance.toLocaleString(undefined, { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      });
    }
    
    // Default formatting for other assets (BTC, ETH, etc.)
    return balance.toLocaleString();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Wallet</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

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

        <div className="bg-dark-800 rounded-xl border border-dark-600/50 p-6 h-fit">
          <h2 className="text-lg font-semibold mb-4">Deposit Funds</h2>
          <form onSubmit={handleDeposit} className="space-y-4">
            <Select
              label="Asset"
              value={selectedAsset}
              onChange={setSelectedAsset}
              options={[
                { value: 'USDC', label: 'USDC' },
                { value: 'BTC', label: 'BTC' },
                { value: 'ETH', label: 'ETH' },
                { value: 'SOL', label: 'SOL' },
              ]}
            />
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
