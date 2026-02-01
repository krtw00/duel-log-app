import type { CreateDuel, Duel, DuelFilter, Pagination, UpdateDuel } from '@duel-log/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api.js';
import { broadcastStreamerStats } from '../lib/broadcast.js';
import { useAuthStore } from '../stores/auth.js';
import { useNotificationStore } from '../stores/notificationStore.js';

type DuelListResponse = { data: Duel[]; pagination: Pagination };

type DuelQueryKey = [string, Partial<DuelFilter>?];

function parseDate(value?: string | number) {
  if (!value) return null;
  if (typeof value === 'number') return new Date(value);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getLimit(filter: Partial<DuelFilter> | undefined, fallback: number) {
  const limit = filter?.limit;
  if (typeof limit === 'number') return limit;
  if (typeof limit === 'string') return Number(limit) || fallback;
  return fallback;
}

function duelMatchesFilter(duel: Duel, filter?: Partial<DuelFilter>) {
  if (!filter) return true;
  if (filter.rangeStart || filter.rangeEnd) return false;
  if (filter.gameMode && duel.gameMode !== filter.gameMode) return false;
  if (filter.deckId && duel.deckId !== filter.deckId) return false;

  const from = parseDate(filter.from ?? filter.fromTimestamp);
  const to = parseDate(filter.to);
  const dueledAt = parseDate(duel.dueledAt);
  if (!dueledAt) return false;
  if (from && dueledAt < from) return false;
  if (to && dueledAt > to) return false;
  return true;
}

function insertSorted(duels: Duel[], duel: Duel) {
  const next = [duel, ...duels];
  next.sort((a, b) => new Date(b.dueledAt).getTime() - new Date(a.dueledAt).getTime());
  return next;
}

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
  const userId = useAuthStore((state) => state.user?.id);
  return useMutation({
    mutationFn: (data: CreateDuel) => api<{ data: Duel }>('/duels', { method: 'POST', body: data }),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['duels'] });
      const previous = queryClient.getQueriesData<DuelListResponse>({ queryKey: ['duels'] });
      const tempId = `temp-${Date.now()}`;
      const now = new Date().toISOString();
      const optimistic: Duel = {
        id: tempId,
        userId: userId ?? '00000000-0000-0000-0000-000000000000',
        deckId: data.deckId,
        opponentDeckId: data.opponentDeckId,
        result: data.result,
        gameMode: data.gameMode,
        isFirst: data.isFirst,
        wonCoinToss: data.wonCoinToss,
        rank: data.rank ?? null,
        rateValue: data.rateValue ?? null,
        dcValue: data.dcValue ?? null,
        memo: data.memo ?? null,
        dueledAt: data.dueledAt,
        createdAt: now,
        updatedAt: now,
      };

      for (const [key, value] of previous) {
        if (!value) continue;
        const [, filter] = key as DuelQueryKey;
        if (!duelMatchesFilter(optimistic, filter)) continue;
        const limit = getLimit(filter, value.pagination.limit);
        const nextData = insertSorted(value.data, optimistic).slice(0, limit);
        queryClient.setQueryData(key, {
          data: nextData,
          pagination: {
            ...value.pagination,
            total: value.pagination.total + 1,
          },
        } satisfies DuelListResponse);
      }

      return { previous, tempId };
    },
    onError: (_error, _data, context) => {
      if (context?.previous) {
        for (const [key, value] of context.previous) {
          queryClient.setQueryData(key, value);
        }
      }
      error(t('duel.registerFailed'));
    },
    onSuccess: (result, _data, context) => {
      const created = result.data;
      if (context?.tempId) {
        const queries = queryClient.getQueriesData<DuelListResponse>({ queryKey: ['duels'] });
        for (const [key, value] of queries) {
          if (!value) continue;
          const updated = value.data.map((duel) => (duel.id === context.tempId ? created : duel));
          queryClient.setQueryData(key, { ...value, data: updated } satisfies DuelListResponse);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['duels'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      broadcastStreamerStats();
      success(t('duel.registered'));
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
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['duels'] });
      const previous = queryClient.getQueriesData<DuelListResponse>({ queryKey: ['duels'] });
      for (const [key, value] of previous) {
        if (!value) continue;
        const nextData = value.data.filter((duel) => duel.id !== id);
        if (nextData.length === value.data.length) continue;
        queryClient.setQueryData(key, {
          data: nextData,
          pagination: {
            ...value.pagination,
            total: Math.max(0, value.pagination.total - 1),
          },
        } satisfies DuelListResponse);
      }
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        for (const [key, value] of context.previous) {
          queryClient.setQueryData(key, value);
        }
      }
      error(t('duel.deleteFailed'));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['duels'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      broadcastStreamerStats();
      success(t('duel.deleted'));
    },
  });
}
