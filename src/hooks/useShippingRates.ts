import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import type { ShippingRate } from '@/types';

export function useShippingRates() {
  return useQuery({
    queryKey: ['shipping-rates'],
    queryFn: async () => {
      const { data } = await api.get<ShippingRate[]>('/shipping');
      return data;
    },
  });
}

export function useCreateShippingRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shippingRate: Partial<ShippingRate>) => {
      const { data } = await api.post<ShippingRate>('/shipping', shippingRate);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-rates'] });
    },
  });
}

export function useUpdateShippingRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...shippingRate }: Partial<ShippingRate> & { id: string }) => {
      const { data } = await api.patch<ShippingRate>(`/shipping/${id}`, shippingRate);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-rates'] });
    },
  });
}

export function useDeleteShippingRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/shipping/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-rates'] });
    },
  });
}
