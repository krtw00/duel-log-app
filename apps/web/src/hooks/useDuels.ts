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
    onMutate: async (newDuelData) => {
      // 進行中のフェッチをキャンセル
      await queryClient.cancelQueries({ queryKey: ['duels'] });

      // 現在のキャッシュを保存（ロールバック用）
      const previousQueries = queryClient.getQueriesData<DuelListResponse>({ queryKey: ['duels'] });

      // 楽観的な新規duelを作成（仮のIDで）
      const optimisticDuel: Duel = {
        id: `temp-${Date.now()}`,
        deckId: newDuelData.deckId,
        opponentDeckId: newDuelData.opponentDeckId,
        result: newDuelData.result,
        gameMode: newDuelData.gameMode,
        isFirst: newDuelData.isFirst,
        wonCoinToss: newDuelData.wonCoinToss,
        rank: newDuelData.rank ?? null,
        rateValue: newDuelData.rateValue ?? null,
        dcValue: newDuelData.dcValue ?? null,
        memo: newDuelData.memo ?? null,
        dueledAt: newDuelData.dueledAt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // すべてのduelsキャッシュを更新（新しいduelを先頭に追加）
      queryClient.setQueriesData<DuelListResponse>({ queryKey: ['duels'] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: [optimisticDuel, ...old.data],
          pagination: { ...old.pagination, total: old.pagination.total + 1 },
        };
      });

      // 成功通知を即座に表示
      success(t('duel.registered'));

      return { previousQueries, optimisticDuel };
    },
    onError: (_err, _newDuel, context) => {
      // エラー時にキャッシュをロールバック
      if (context?.previousQueries) {
        for (const [queryKey, data] of context.previousQueries) {
          queryClient.setQueryData(queryKey, data);
        }
      }
      error(t('duel.registerFailed'));
    },
    onSettled: () => {
      // 最終的にサーバーと同期（バックグラウンド）
      queryClient.invalidateQueries({ queryKey: ['duels'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      broadcastStreamerStats();
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
    onMutate: async ({ id, data: updateData }) => {
      await queryClient.cancelQueries({ queryKey: ['duels'] });

      const previousQueries = queryClient.getQueriesData<DuelListResponse>({ queryKey: ['duels'] });

      // キャッシュ内の該当duelを更新
      queryClient.setQueriesData<DuelListResponse>({ queryKey: ['duels'] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((duel) =>
            duel.id === id ? { ...duel, ...updateData, updatedAt: new Date().toISOString() } : duel,
          ),
        };
      });

      success(t('duel.updated'));
      return { previousQueries };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousQueries) {
        for (const [queryKey, data] of context.previousQueries) {
          queryClient.setQueryData(queryKey, data);
        }
      }
      error(t('duel.updateFailed'));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['duels'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      broadcastStreamerStats();
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

      const previousQueries = queryClient.getQueriesData<DuelListResponse>({ queryKey: ['duels'] });

      // キャッシュから該当duelを削除
      queryClient.setQueriesData<DuelListResponse>({ queryKey: ['duels'] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.filter((duel) => duel.id !== id),
          pagination: { ...old.pagination, total: Math.max(0, old.pagination.total - 1) },
        };
      });

      success(t('duel.deleted'));
      return { previousQueries };
    },
    onError: (_err, _id, context) => {
      if (context?.previousQueries) {
        for (const [queryKey, data] of context.previousQueries) {
          queryClient.setQueryData(queryKey, data);
        }
      }
      error(t('duel.deleteFailed'));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['duels'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      broadcastStreamerStats();
    },
  });
}
