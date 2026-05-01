import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import type { Expense, ExpenseCategory } from '@/types';

export interface CreateExpensePayload {
  description: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  notes?: string;
}

export function useExpenses() {
  return useQuery<Expense[]>({
    queryKey: ['expenses'],
    queryFn: async () => {
      const { data } = await api.get('/expenses');
      return data;
    },
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateExpensePayload) => {
      const { data } = await api.post('/expenses', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<CreateExpensePayload> & { id: string }) => {
      const { data } = await api.patch(`/expenses/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/expenses/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}
