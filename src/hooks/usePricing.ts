import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import type { PricingSettings, PriceBreakdown, PriceInput } from '@/types';

export function usePricingSettings() {
  return useQuery({
    queryKey: ['pricing-settings'],
    queryFn: async () => {
      const { data } = await api.get<PricingSettings>('/pricing/settings');
      return data;
    },
  });
}

export function useUpdatePricingSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: Partial<PricingSettings>) => {
      const { data } = await api.patch<PricingSettings>('/pricing/settings', body);
      return data;
    },
    onSuccess: () => {
      // Cambiar un costo cambia todos los precios: se invalida el cálculo
      // además de los parámetros.
      queryClient.invalidateQueries({ queryKey: ['pricing-settings'] });
      queryClient.invalidateQueries({ queryKey: ['pricing-calculate'] });
    },
  });
}

/**
 * El costeo lo hace el backend, no esta pantalla: es la única lógica de plata
 * del proyecto y allá está cubierta por pruebas. Se recalcula solo cuando los
 * números dejan de cambiar, para no disparar una petición por cada tecla.
 */
export function usePriceCalculation(input: PriceInput, enabled = true) {
  return useQuery({
    queryKey: ['pricing-calculate', input],
    enabled,
    // Mantiene el resultado anterior en pantalla mientras llega el nuevo, así
    // los números no parpadean a vacío mientras se escribe.
    placeholderData: (previous) => previous,
    queryFn: async () => {
      const { data } = await api.post<{
        settings: PricingSettings;
        breakdown: PriceBreakdown;
      }>('/pricing/calculate', input);
      return data;
    },
  });
}
