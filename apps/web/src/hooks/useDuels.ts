import type { CreateDuel, Duel, DuelFilter, Pagination, UpdateDuel } from '@duel-log/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';

type DuelListResponse = { data: Duel[]; pagination: Pagination };

export function useDuels(filter?: Partial<DuelFilter>) {
  return useQuery({
    queryKey: ['duels', filter],
    queryFn: () =>
      api<DuelListResponse>('/duels', {
        params: {
          gameMode: filter?.gameMode,
          deckId: filter?.deckId,
          from: filter?.from,
          to: filter?.to,
          fromTimestamp: filter?.fromTimestamp,
          limit: filter?.limit?.toString(),
          offset: filter?.offset?.toString(),
        },
      }),
  });
}

export function useCreateDuel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDuel) => api<{ data: Duel }>('/duels', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['duels'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
    },
  });
}

export function useUpdateDuel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDuel }) =>
      api<{ data: Duel }>(`/duels/${id}`, { method: 'PATCH', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['duels'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
    },
  });
}

export function useDeleteDuel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/duels/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['duels'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
    },
  });
}
