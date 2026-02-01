import type { CreateDuel, Duel, DuelFilter, Pagination, UpdateDuel } from '@duel-log/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api.js';
import { broadcastStreamerStats } from '../lib/broadcast.js';
import { useNotificationStore } from '../stores/notificationStore.js';

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
          rangeStart: filter?.rangeStart?.toString(),
          rangeEnd: filter?.rangeEnd?.toString(),
          limit: filter?.limit?.toString(),
          offset: filter?.offset?.toString(),
        },
      }),
  });
}

export function useCreateDuel() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { success, error } = useNotificationStore();
  return useMutation({
    mutationFn: (data: CreateDuel) => api<{ data: Duel }>('/duels', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['duels'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      broadcastStreamerStats();
      success(t('duel.registered'));
    },
    onError: () => {
      error(t('duel.registerFailed'));
    },
  });
}

export function useUpdateDuel() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { success, error } = useNotificationStore();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDuel }) =>
      api<{ data: Duel }>(`/duels/${id}`, { method: 'PATCH', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['duels'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      broadcastStreamerStats();
      success(t('duel.updated'));
    },
    onError: () => {
      error(t('duel.updateFailed'));
    },
  });
}

export function useDeleteDuel() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { success, error } = useNotificationStore();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/duels/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['duels'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      broadcastStreamerStats();
      success(t('duel.deleted'));
    },
    onError: () => {
      error(t('duel.deleteFailed'));
    },
  });
}
