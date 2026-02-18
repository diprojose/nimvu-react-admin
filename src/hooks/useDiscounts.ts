import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import type { Discount } from '@/types';

export function useDiscounts() {
  return useQuery({
    queryKey: ['discounts'],
    queryFn: async () => {
      const { data } = await api.get<Discount[]>('/discounts');
      return data;
    },
  });
}

export function useCreateDiscount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (discount: Partial<Discount>) => {
      const { data } = await api.post<Discount>('/discounts', discount);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
    },
  });
}

export function useUpdateDiscount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...discount }: Partial<Discount> & { id: string }) => {
      const { data } = await api.patch<Discount>(`/discounts/${id}`, discount);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
    },
  });
}

export function useDeleteDiscount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/discounts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
    },
  });
}
