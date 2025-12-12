
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { balanceService } from '../services/balanceService';

export const useBalances = () => {
  return useQuery({
    queryKey: ['balances'],
    queryFn: balanceService.getAll,
    staleTime: 10000, // 10 seconds
    retry: false, // Don't retry on 401
  });
};

export const useBalanceBySymbol = (symbol: string) => {
  return useQuery({
    queryKey: ['balance', symbol],
    queryFn: () => balanceService.getBySymbol(symbol),
    enabled: !!symbol,
  });
};

export const useDeposit = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ symbol, amount, decimals }: { symbol: string; amount: number; decimals?: number }) =>
      balanceService.deposit(symbol, amount, decimals),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balances'] });
    },
  });
};
