
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTicker } from '../hooks/useBackpackWs';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from './ui/Button';
import { useBalances } from '../hooks/useBalances';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Data hooks
  const { data: balances } = useBalances();
  const { price: btcPrice } = useTicker('BTC');
  const { price: ethPrice } = useTicker('ETH');

  // Calculate total estimated balance
  const totalBalance = React.useMemo(() => {
    if (!balances) return 0;
    let total = 0;
    balances.forEach(b => {
      if (b.symbol === 'USDC' || b.symbol === 'USDT') {
        total += Number(b.balanceRaw) / Math.pow(10, b.balanceDecimals);
      }
    });
    return total;
  }, [balances]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-dark-800 border-b border-dark-600/50 flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center font-bold text-white">N</div>
          <span className="font-bold text-xl tracking-tight hidden sm:block">NovaTrade</span>
        </Link>

        {user && (
          <div className="hidden md:flex items-center gap-4 pl-6 border-l border-dark-600/50">
            <div className="flex flex-col">
              <span className="text-xs text-muted">BTC</span>
              <span className="text-sm font-semibold text-white">${btcPrice.toLocaleString()}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted">ETH</span>
              <span className="text-sm font-semibold text-white">${ethPrice.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <div className="text-right hidden sm:block">
              <span className="text-xs text-muted block">Wallet Balance</span>
              <span className="text-sm font-semibold text-white">${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <Link to="/wallet">
              <Button variant="outline" className="px-4 py-2 text-sm">Wallet</Button>
            </Link>
            <Button variant="ghost" onClick={handleLogout} className="text-sm">Log Out</Button>
          </>
        ) : (
          <Link to="/login">
            <Button variant="primary" className="text-sm px-6">Sign In</Button>
          </Link>
        )}
      </div>
    </header>
  );
};
