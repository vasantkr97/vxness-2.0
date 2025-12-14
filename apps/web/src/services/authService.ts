
import api from '../lib/api';
import type { User, AuthResponse } from '../types';

export const authService = {
  signup: async (data: { username: string; email: string; password: string }) => {
    const response = await api.post<AuthResponse>('/auth/signup', data);
    return response.data;
  },

  signin: async (data: { email: string; password: string }) => {
    const response = await api.post<AuthResponse>('/auth/signin', data);
    return response.data;
  },

  signout: async () => {
    const response = await api.post('/auth/signout');
    return response.data;
  },

  getMe: async (): Promise<User | null> => {
    try {
      const response = await api.get<{ user: User }>('/auth/me');
      return response.data.user;
    } catch {
      return null;
    }
  },
  
};
