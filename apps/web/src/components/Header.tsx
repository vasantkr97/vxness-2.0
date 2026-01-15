
import React, { useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTicker } from '../hooks/useBackpackWs';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from './ui/Button';
import { useBalances } from '../hooks/useBalances';
import { useTrade } from '../context/TradeContext';
import { useToast } from '../context/ToastContext';

const FlashPrice: React.FC<{ value: number; className?: string; updatedAt?: number }> = ({
  value,
  className = '',
  updatedAt = 0
}) => {
  const prevValueRef = useRef(value);

  useEffect(() => {
    prevValueRef.current = value;
  }, [value, updatedAt]);

  return (
    <span
      className={`${className} transition-colors duration-150`}
    >
      ${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
    </span>
  );
};

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const { currentAsset } = useTrade();
  const { toast } = useToast();

  const { data: balances } = useBalances();
  const { ask, updatedAt } = useTicker(currentAsset);
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
        <Link to={user ? "/trade" : "/"} className="flex items-center gap-2">
          <img src="/vxness_logo.png" alt="vxness" className="w-auto h-10 object-contain block" />
          <span className="font-bold text-xl tracking-tight hidden sm:block text-amber-500">vxness</span>
        </Link>

        {user && (
          <div className="hidden md:flex items-center gap-4 pl-6 border-l border-dark-600/50">
            <div className="flex flex-col">
              <span className="text-xs text-muted">
                {currentAsset.includes('_') ? currentAsset.replace('_', '/') : `${currentAsset}/USDC`}
              </span>
              <span className="text-sm font-semibold text-white">
                <FlashPrice value={ask} updatedAt={updatedAt} />
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className={`transition-all duration-300 transform ${toast?.visible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}>
          {toast && (
            <div className={`px-4 py-2 rounded-full shadow-lg border backdrop-blur-sm flex items-center gap-2 ${toast.type === 'success' ? 'bg-success/10 border-success/20 text-success' :
              toast.type === 'error' ? 'bg-danger/10 border-danger/20 text-danger' :
                'bg-dark-700/80 border-dark-600 text-white'
              }`}>
              <span className="text-sm font-medium whitespace-nowrap">{toast.message}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <div className="text-right hidden sm:block">
              <span className="text-xs text-muted block">Wallet Balance</span>
              <span className="text-sm font-semibold text-white">${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <Link to="/wallet">
              <Button variant="outline" className="px-4 py-2 text-sm">Wallet</Button>
            </Link>
            <Button variant="ghost" onClick={handleLogout} className="text-sm">Log Out</Button>
          </>
        ) : (
          <Link to="/login">
            {/* <Button variant="primary" className="text-sm px-6"></Button> */}
          </Link>
        )}
      </div>
    </header>
  );
};
