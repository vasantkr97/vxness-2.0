
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersService } from '../services/ordersService';
import type { CreateOrderRequest } from '../types';

export const useOrders = () => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: ordersService.getAll,
    staleTime: 2000, // 2 seconds
    refetchInterval: 3000, // Refetch every 3 seconds for quicker updates
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
    onError: (error: Error) => {
      console.error('[useCloseOrder] Failed to close order:', error.message);
      // Invalidate to get fresh state even on error
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};
