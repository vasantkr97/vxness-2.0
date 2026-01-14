
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Chart } from '../components/Chart';
import { OrderForm } from '../components/OrderForm';
import { PositionsTable } from '../components/PositionsTable';
import { InstrumentsPanel } from '../components/cryptos';
import { useAuth } from '../hooks/useAuth';
import { useTrade } from '../context/TradeContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const InlineAuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signin, signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    let result;
    if (isLogin) {
      result = await signin(email, password);
    } else {
      result = await signup(username, email, password);
    }
    
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Authentication failed');
    }
  };

  return (
    <div className="flex flex-col h-full justify-center p-6 bg-dark-800/50">
        <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-white mb-2">{isLogin ? 'Welcome Back' : 'Create Account'}</h3>
            <p className="text-muted text-sm">
                {isLogin ? 'Sign in to start trading' : 'Join NovaTrade Pro today'}
            </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
             {!isLogin && (
                 <Input 
                    label="Username" 
                    value={username} 
                    onChange={e => setUsername(e.target.value)} 
                    placeholder="Trader123"
                    required 
                 />
             )}
             <Input 
                label="Email" 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="name@example.com"
                required 
             />
             <Input 
                label="Password" 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="••••••••"
                required 
             />
             
             {error && <div className="text-danger text-xs text-center">{error}</div>}

             <Button fullWidth disabled={loading} variant="primary" className="mt-2">
                 {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
             </Button>
        </form>

        <div className="mt-6 text-center text-sm">
            <span className="text-muted">{isLogin ? "Don't have an account?" : "Already have an account?"}</span>
            <button 
                onClick={() => { setIsLogin(!isLogin); setError(''); }} 
                className="ml-2 text-accent hover:text-accent/80 font-medium outline-none"
            >
                {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
        </div>
    </div>
  );
};

export const Trade: React.FC = () => {
  const { user } = useAuth();
  const { currentAsset: asset, setAsset } = useTrade();

  const [leftWidth, setLeftWidth] = useState(280);
  const [topHeightPercent, setTopHeightPercent] = useState(60);
  const [resizing, setResizing] = useState<'left' | 'vertical' | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  const handleAssetSelect = (symbol: string) => {
    setAsset(symbol);
  };

  const orderFormAsset = (['BTC', 'ETH', 'SOL'].includes(asset) ? asset : 'BTC') as 'BTC' | 'ETH' | 'SOL';

  const startResize = (direction: 'left' | 'vertical') => (e: React.MouseEvent) => {
    e.preventDefault();
    setResizing(direction);
  };

  const stopResize = useCallback(() => {
    setResizing(null);
  }, []);

  const handleResize = useCallback((e: MouseEvent) => {
    if (!resizing) return;

    if (resizing === 'left') {
        const newWidth = Math.max(200, Math.min(e.clientX, 500));
        setLeftWidth(newWidth);
    } else if (resizing === 'vertical' && mainRef.current) {
        const rect = mainRef.current.getBoundingClientRect();
        const relativeY = e.clientY - rect.top;
        const newPercent = Math.max(20, Math.min((relativeY / rect.height) * 100, 85));
        setTopHeightPercent(newPercent);
    }
  }, [resizing]);

  useEffect(() => {
    if (resizing) {
        window.addEventListener('mousemove', handleResize);
        window.addEventListener('mouseup', stopResize);
        document.body.style.userSelect = 'none';
        document.body.style.cursor = resizing === 'vertical' ? 'row-resize' : 'col-resize';
    }
    return () => {
        window.removeEventListener('mousemove', handleResize);
        window.removeEventListener('mouseup', stopResize);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
    };
  }, [resizing, handleResize, stopResize]);

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-dark-900">
      
      {/* Left Panel: Instruments pannel */}
      <div style={{ width: leftWidth }} className="flex-shrink-0 hidden md:block relative">
        <InstrumentsPanel 
            currentAsset={asset} 
            onSelectAsset={handleAssetSelect} 
            className="h-full w-full"
        />
        <div 
            className="absolute top-0 right-0 w-px h-full cursor-col-resize hover:bg-gray-500/50 transition-colors z-20 active:bg-gray-500"
            onMouseDown={startResize('left')}
        />
      </div>

      {/* Middle Panel: Chart + Positions */}
      <div className="flex-1 flex flex-col min-w-0 bg-dark-900 relative" ref={mainRef}>
        
        <div style={{ height: `${topHeightPercent}%` }} className="flex w-full relative">
           <div className="flex-1 min-w-0 bg-dark-800 relative">
              <Chart asset={asset} />
           </div>
        </div>

        <div 
            className="h-px w-full cursor-row-resize bg-dark-600/50 transition-colors z-20 active:bg-gray-500 flex-shrink-0"
            onMouseDown={startResize('vertical')}
        />

        <div className="flex-1 min-h-0 bg-dark-900 relative">
           {user ? (
             <PositionsTable />
           ) : (
             <div className="flex flex-col items-center justify-center h-full bg-dark-800/20 text-muted">
                <p className="mb-2 text-sm">Sign in to view open positions and order history.</p>
             </div>
           )}
        </div>
      </div>

      {/* Right Panel: Order Form */}
      <div className="flex-shrink-0 w-[320px] bg-dark-800 border-l border-dark-600/50 overflow-y-auto no-scrollbar">
          <div className="p-4 h-full">
              {user ? (
                <OrderForm asset={orderFormAsset} />
              ) : (
                <InlineAuthForm />
              )}
          </div>
      </div>

    </div>
  );
};
