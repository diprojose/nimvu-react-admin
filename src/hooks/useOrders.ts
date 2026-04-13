import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import type { Order, OrderStatus } from '@/types';

export interface ManualOrderItem {
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
}

export interface CreateManualOrderPayload {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  address: string;
  city: string;
  state: string;
  items: ManualOrderItem[];
  paymentMethod?: 'WOMPI' | 'CASH_ON_DELIVERY' | 'WHATSAPP';
  shippingCost?: number;
  notes?: string;
}

export function useOrders(status?: OrderStatus) {
  return useQuery<Order[]>({
    queryKey: ['orders', status],
    queryFn: async () => {
      const params = status ? { status } : {};
      console.log('Fetching orders with params:', params);
      const { data } = await api.get('/orders', { params });
      console.log('Orders response data:', data);
      return data;
    },
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await api.patch(`/orders/${id}`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/orders/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useCreateManualOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateManualOrderPayload) => {
      const { data } = await api.post('/orders/manual', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
