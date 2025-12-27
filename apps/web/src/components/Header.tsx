
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTicker } from '../hooks/useBackpackWs';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from './ui/Button';
import { useBalances } from '../hooks/useBalances';
import { useTrade } from '../context/TradeContext';

// Component for displaying price with flash animation
const FlashPrice: React.FC<{ value: number; className?: string; updatedAt?: number }> = ({ 
  value, 
  className = '',
  updatedAt = 0
}) => {
  const [flash, setFlash] = useState(false);
  const prevValueRef = useRef(value);
  
  // Flash on value change or fresh update
  useEffect(() => {
    // If we have a valid update and (value changed OR it's a new tick)
    if (value > 0 && (prevValueRef.current !== value || updatedAt > 0)) {
      setFlash(true);
      const timer = setTimeout(() => setFlash(false), 300);
      prevValueRef.current = value;
      return () => clearTimeout(timer);
    }
    prevValueRef.current = value;
  }, [value, updatedAt]); 

  return (
    <span 
      className={`${className} transition-colors duration-150 ${flash ? 'text-yellow-400' : ''}`}
    >
      ${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
    </span>
  );
};

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Get current asset from global state
  const { currentAsset } = useTrade();

  // Data hooks
  const { data: balances } = useBalances();
  // Fetch price for the currently selected asset
  const { ask, updatedAt } = useTicker(currentAsset);

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
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white" style={{ backgroundColor: '#4387ecff' }}>V</div>
          <span className="font-bold text-xl tracking-tight hidden sm:block" >vxness</span>
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
            {/* <Button variant="primary" className="text-sm px-6"></Button> */}
          </Link>
        )}
      </div>
    </header>
  );
};
