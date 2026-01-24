import type { CreateSharedStatistics, SharedStatistics } from '@duel-log/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';

export function useSharedStatisticsList() {
  return useQuery({
    queryKey: ['shared-statistics'],
    queryFn: () => api<{ data: SharedStatistics[] }>('/shared-statistics'),
  });
}

export function useCreateSharedStatistics() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSharedStatistics) =>
      api<{ data: SharedStatistics }>('/shared-statistics', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-statistics'] });
    },
  });
}

export function useDeleteSharedStatistics() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/shared-statistics/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-statistics'] });
    },
  });
}
