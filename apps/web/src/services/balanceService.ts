
import api from '../lib/api';
import type { Balance, BalanceResponse } from '../types';

export const balanceService = {

  getAll: async (): Promise<Balance[]> => {
    const response = await api.get<BalanceResponse>('/balance');
    return response.data.balances;
  },

  getBySymbol: async (symbol: string): Promise<Balance> => {
    const response = await api.get<Balance>(`/balance/${symbol}`);
    return response.data;
  },

  deposit: async (symbol: string, amount: number, decimals?: number): Promise<Balance> => {
    const response = await api.post<Balance>('/balance/deposit', { symbol, amount, decimals });
    return response.data;
  },

};
