import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { AxiosError } from 'axios';
import { authService } from '../services/authService';
import type { User } from '../types';
import { AuthContext } from './auth';

interface ApiErrorPayload {
  error?: string | { message?: string };
  message?: string;
  msg?: string;
}

interface AuthProviderProps {
  children: ReactNode;
}

const getAuthErrorMessage = (error: unknown, fallback: string) => {
  const axiosError = error as AxiosError<ApiErrorPayload | string>;

  if (!axiosError.response) {
    return 'Unable to reach Vxness. Check your connection and try again.';
  }

  const data = axiosError.response.data;

  if (typeof data === 'string') return data.trim() || fallback;
  if (typeof data?.error === 'string' && data.error.trim()) return data.error;
  if (typeof data?.error === 'object' && data.error?.message) return data.error.message;
  if (data?.message?.trim()) return data.message;
  if (data?.msg?.trim()) return data.msg;

  return fallback;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const userData = await authService.getMe();
      setUser(userData);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void checkAuth();
    }, 0);

    return () => window.clearTimeout(timeoutId);
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
    } catch (error) {
      return {
        success: false,
        error: getAuthErrorMessage(error, 'Vxness could not sign you in. Please try again.'),
      };
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
    } catch (error) {
      return {
        success: false,
        error: getAuthErrorMessage(error, 'Vxness could not create your account. Please try again.'),
      };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth, signin, signup }}>
      {children}
    </AuthContext.Provider>
  );
};
