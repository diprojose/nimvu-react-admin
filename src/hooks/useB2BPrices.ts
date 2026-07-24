import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import type { Product } from '@/types';

export function useB2BProducts() {
  // We can reuse the products endpoint as it now includes b2bPrices
  return useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const { data } = await api.get('/products');
      return data;
    },
  });
}

export interface B2BPriceBulkItem {
  productId: string;
  price12: number;
  price50: number;
  price200: number;
  isActive: boolean;
}

export function useUpdateB2BPricesBulk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pricesDto: { prices: B2BPriceBulkItem[] }) => {
      const { data } = await api.post('/products/b2b-prices/bulk', pricesDto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
