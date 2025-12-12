
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersService } from '../services/ordersService';
import type { CreateOrderRequest } from '../types';

export const useOrders = () => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: ordersService.getAll,
    staleTime: 5000, // 5 seconds
    refetchInterval: 10000, // Refetch every 10 seconds for live PnL updates
    retry: false,
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateOrderRequest) => ordersService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['balances'] });
    },
  });
};

export const useCloseOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ orderId, closeReason }: { orderId: string; closeReason?: string }) =>
      ordersService.close(orderId, closeReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['balances'] });
    },
  });
};
