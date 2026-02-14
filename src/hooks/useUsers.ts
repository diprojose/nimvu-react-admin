import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import type { User } from '@/types';

export function useUsers() {
  return useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data;
    },
  });
}
