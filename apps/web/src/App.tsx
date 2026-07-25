
import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { useAuth } from './hooks/useAuth';
import { TradeProvider } from './context/TradeContext';
import { ToastProvider } from './context/ToastContext';
import { Header } from './components/Header';

const Trade = lazy(() => import('./pages/Trade').then(module => ({ default: module.Trade })));
const Wallet = lazy(() => import('./pages/Wallet').then(module => ({ default: module.Wallet })));
const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const Landing = lazy(() => import('./pages/Landing').then(module => ({ default: module.Landing })));
const Signup = lazy(() => import('./pages/Signup').then(module => ({ default: module.Signup })));

const PageLoader = () => (
  <div className="h-screen flex items-center justify-center bg-dark-900 text-muted">Loading Vxness...</div>
);

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
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route element={<Layout />}>
                  <Route element={<ProtectedRoute />}>
                    <Route path="/trade" element={<Trade />} />
                    <Route path="/wallet" element={<Wallet />} />
                  </Route>
                </Route>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
              </Routes>
            </Suspense>
          </Router>
        </TradeProvider>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
