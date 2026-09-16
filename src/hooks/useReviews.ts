import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import type { Review, ReviewStatus } from '@/types';

/**
 * Cola de moderación. El backend devuelve las pendientes primero, que es lo
 * que hay que trabajar; sin filtro trae todas.
 */
export function useReviews(status?: ReviewStatus) {
  return useQuery({
    queryKey: ['reviews', status ?? 'all'],
    queryFn: async () => {
      const { data } = await api.get<Review[]>('/reviews', {
        params: status ? { status } : undefined,
      });
      return data;
    },
  });
}

/**
 * Aprobar, rechazar o responder. El backend recalcula el promedio del producto
 * e invalida la caché de la tienda, así que aquí basta con refrescar la lista.
 */
export function useModerateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...body
    }: {
      id: string;
      status?: ReviewStatus;
      adminReply?: string;
    }) => {
      const { data } = await api.patch<Review>(`/reviews/${id}`, body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/reviews/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
}
