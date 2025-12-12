import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authService } from '../services/authService';
import type { User } from '../types';
import { AxiosError } from 'axios';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  signin: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  signup: (username: string, email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const userData = await authService.getMe();
      setUser(userData);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  const login = (userData: User) => setUser(userData);

  const logout = async () => {
    try {
      await authService.signout();
    } catch (error) {
      console.error('Logout failed', error);
    } finally {
      setUser(null);
    }
  };

  const signin = async (email: string, password: string) => {
    try {
      const response = await authService.signin({ email, password });
      if (response.success) {
        setUser(response.user);
        return { success: true, user: response.user };
      }
      return { success: false, error: 'Login failed' };
    } catch (err) {
      const error = err as AxiosError;
      const data = error.response?.data as { message?: string } | undefined;
      return { success: false, error: data?.message || 'Login failed' };
    }
  };

  const signup = async (username: string, email: string, password: string) => {
    try {
      const response = await authService.signup({ username, email, password });
      if (response.success) {
        setUser(response.user);
        return { success: true, user: response.user };
      }
      return { success: false, error: 'Signup failed' };
    } catch (err) {
      const error = err as AxiosError;
      const data = error.response?.data as { message?: string } | undefined;
      return { success: false, error: data?.message || 'Signup failed' };
    }
  };

  const value = { user, loading, login, logout, checkAuth, signin, signup };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};