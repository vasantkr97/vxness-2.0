
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const result = await signin(email, password);
    setLoading(false);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-dark-800 rounded-xl border border-dark-600/50 p-8 shadow-xl">
        <h2 className="text-2xl font-bold text-center mb-2">Welcome Back</h2>
        <p className="text-muted text-center mb-8">Sign in to continue trading</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Email" 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
          />
          <Input 
            label="Password" 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
          />
          
          {error && <div className="text-danger text-sm text-center">{error}</div>}
          
          <Button fullWidth className="mt-2" disabled={loading}>
             {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <p className="text-center text-muted text-sm mt-6">
          Don't have an account? <Link to="/signup" className="text-accent hover:underline">Sign Up</Link>
        </p>
      </div>
    </div>
  );
};
