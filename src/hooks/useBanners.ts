import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import type { Banner } from '@/types';

interface BannerFilter {
  universeId?: string;
  home?: boolean;
}

export function useBanners(filter: BannerFilter = {}) {
  return useQuery({
    queryKey: ['banners', filter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter.universeId) params.set('universeId', filter.universeId);
      if (filter.home) params.set('home', 'true');
      const qs = params.toString() ? `?${params.toString()}` : '';
      const { data } = await api.get<Banner[]>(`/banners${qs}`);
      return data;
    },
  });
}

export function useCreateBanner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (banner: Partial<Banner>) => {
      const { data } = await api.post<Banner>('/banners', banner);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
    },
  });
}

export function useUpdateBanner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...banner }: Partial<Banner> & { id: string }) => {
      const { data } = await api.patch<Banner>(`/banners/${id}`, banner);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
    },
  });
}

export function useDeleteBanner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/banners/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
    },
  });
}
