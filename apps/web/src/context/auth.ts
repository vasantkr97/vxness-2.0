import { createContext } from 'react';
import type { User } from '../types';

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

export interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  signin: (email: string, password: string) => Promise<AuthResult>;
  signup: (username: string, email: string, password: string) => Promise<AuthResult>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
