import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import type { CheckoutLead, CheckoutLeadStatus } from '@/types';

/**
 * @param includeConverted incluye los que terminaron comprando. Sirve para
 * medir cuántos abandonos se recuperaron; por defecto el backend los oculta.
 */
export function useCheckoutLeads(includeConverted = false) {
  return useQuery({
    queryKey: ['checkout-leads', includeConverted],
    queryFn: async () => {
      const { data } = await api.get<CheckoutLead[]>('/checkout-leads', {
        params: includeConverted ? { includeConverted: 'true' } : undefined,
      });
      return data;
    },
  });
}

/**
 * Un lead puntual. Lo usa el editor de órdenes manuales para precargar el
 * carrito abandonado cuando se llega con `?leadId=`.
 *
 * A diferencia del listado, este trae el lead aunque ya esté convertido o
 * marcado como perdido: si alguien abrió el link es porque quiere trabajarlo.
 */
export function useCheckoutLead(id?: string) {
  return useQuery({
    queryKey: ['checkout-lead', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<CheckoutLead>(`/checkout-leads/${id}`);
      return data;
    },
  });
}

export function useUpdateCheckoutLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...body
    }: {
      id: string;
      status?: CheckoutLeadStatus;
      note?: string;
    }) => {
      const { data } = await api.patch<CheckoutLead>(`/checkout-leads/${id}`, body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkout-leads'] });
    },
  });
}

export function useDeleteCheckoutLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/checkout-leads/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkout-leads'] });
    },
  });
}
