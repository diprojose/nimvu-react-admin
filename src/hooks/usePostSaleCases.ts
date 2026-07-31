import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import type {
  PostSaleCase,
  PostSaleFault,
  PostSaleShippingPayer,
  PostSaleStatus,
  PostSaleType,
  ShippingCarrier,
} from '@/types';

export interface PostSaleItemInput {
  productId: string;
  variantName?: string;
  fromVariantName?: string;
  quantity?: number;
  note?: string;
}

export interface PostSaleCaseInput {
  orderId: string;
  type: PostSaleType;
  fault?: PostSaleFault;
  status?: PostSaleStatus;
  description?: string;
  shippingPayer?: PostSaleShippingPayer;
  shippingAmount?: number;
  shippingCarrier?: ShippingCarrier;
  trackingNumber?: string;
  items?: PostSaleItemInput[];
}

// Los casos llegan embebidos en cada orden (GET /orders), asi que al mutar
// basta con invalidar 'orders' para refrescar la vista.
const useCaseMutation = <TVars>(
  fn: (vars: TVars) => Promise<PostSaleCase | void>,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

export function useCreatePostSaleCase() {
  return useCaseMutation(async (input: PostSaleCaseInput) => {
    const { data } = await api.post('/post-sale-cases', input);
    return data;
  });
}

export function useUpdatePostSaleCase() {
  return useCaseMutation(
    async ({ id, ...input }: Partial<PostSaleCaseInput> & { id: string }) => {
      const { data } = await api.patch(`/post-sale-cases/${id}`, input);
      return data;
    },
  );
}

export function useDeletePostSaleCase() {
  return useCaseMutation(async (id: string) => {
    await api.delete(`/post-sale-cases/${id}`);
  });
}
