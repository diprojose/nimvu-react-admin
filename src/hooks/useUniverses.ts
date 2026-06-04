import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import type { Universe } from '@/types';

export function useUniverses() {
  return useQuery({
    queryKey: ['universes'],
    queryFn: async () => {
      const { data } = await api.get<Universe[]>('/universes');
      return data;
    },
  });
}

export function useCreateUniverse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (universe: Partial<Universe>) => {
      const { data } = await api.post<Universe>('/universes', universe);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['universes'] });
    },
  });
}

export function useUpdateUniverse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...universe }: Partial<Universe> & { id: string }) => {
      const { data } = await api.patch<Universe>(`/universes/${id}`, universe);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['universes'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useDeleteUniverse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/universes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['universes'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}
