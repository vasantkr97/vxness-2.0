
import api from '../lib/api';
import type { Order, CreateOrderRequest } from '../types';

export const ordersService = {
  getAll: async (): Promise<Order[]> => {
    const response = await api.get<{ orders: Order[] }>('/orders');
    return response.data.orders;
  },
  create: async (data: CreateOrderRequest): Promise<{ message: string; orderId: string }> => {
    const response = await api.post<{ message: string; orderId: string }>('/orders', data);
    return response.data;
  },
  close: async (orderId: string, closeReason?: string): Promise<{ message: string; orderId: string; finalPnl?: number }> => {
    const response = await api.post(`/orders/${orderId}/close`, { closeReason });
    return response.data;
  },
};
