
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { TradeProvider } from './context/TradeContext';
import { ToastProvider } from './context/ToastContext';
import { Header } from './components/Header';
import { Trade } from './pages/Trade';
import { Wallet } from './pages/Wallet';
import { Login } from './pages/Login';
import { Landing } from './pages/Landing';
import { Signup } from './pages/Signup';

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="h-screen flex items-center justify-center bg-dark-900 text-muted">Loading...</div>;

  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

const Layout = () => {
  return (
    <div className="min-h-screen bg-dark-900 text-white font-sans selection:bg-accent/30 selection:text-accent-100">
      <Header />
      <main>
        <Outlet />
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <TradeProvider>
          <Router>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                <Route element={<ProtectedRoute />}>
                  <Route path="/trade" element={<Trade />} />
                  <Route path="/wallet" element={<Wallet />} />
                </Route>
              </Route>
              <Route path="/" element={<Landing />} />
            </Routes>
          </Router>
        </TradeProvider>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
