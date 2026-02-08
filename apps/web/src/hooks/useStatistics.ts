import type {
  DeckWinRate,
  MatchupEntry,
  OverviewStats,
  StatisticsFilter,
  Streaks,
  ValueSequenceEntry,
} from '@duel-log/shared';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { api } from '../lib/api.js';

function filterParams(filter?: StatisticsFilter): Record<string, string | undefined> {
  return {
    gameMode: filter?.gameMode,
    from: filter?.from,
    to: filter?.to,
    fromTimestamp: filter?.fromTimestamp,
    deckId: filter?.deckId,
    rangeStart: filter?.rangeStart?.toString(),
    rangeEnd: filter?.rangeEnd?.toString(),
  };
}

export function useOverviewStats(filter?: StatisticsFilter) {
  return useQuery({
    queryKey: ['statistics', 'overview', filter],
    queryFn: () =>
      api<{ data: OverviewStats }>('/statistics/overview', { params: filterParams(filter) }),
  });
}

export function useWinRates(filter?: StatisticsFilter) {
  return useQuery({
    queryKey: ['statistics', 'win-rates', filter],
    queryFn: () =>
      api<{ data: DeckWinRate[] }>('/statistics/win-rates', { params: filterParams(filter) }),
  });
}

export function useMatchups(filter?: StatisticsFilter) {
  return useQuery({
    queryKey: ['statistics', 'matchups', filter],
    queryFn: () =>
      api<{ data: MatchupEntry[] }>('/statistics/matchups', { params: filterParams(filter) }),
  });
}

export function useStreaks(filter?: StatisticsFilter) {
  return useQuery({
    queryKey: ['statistics', 'streaks', filter],
    queryFn: () => api<{ data: Streaks }>('/statistics/streaks', { params: filterParams(filter) }),
  });
}

export function useValueSequence(filter?: StatisticsFilter & { gameMode: 'RANK' | 'RATE' | 'DC' }) {
  return useQuery({
    queryKey: ['statistics', 'value-sequence', filter],
    queryFn: () =>
      api<{ data: ValueSequenceEntry[] }>('/statistics/value-sequence', {
        params: filterParams(filter),
      }),
    enabled: !!filter?.gameMode,
  });
}

type ModeCountsResponse = { data: Record<string, number> };

export function useModeCounts(filter: { from: string; to: string }) {
  return useQuery({
    queryKey: ['statistics', 'mode-counts', filter],
    queryFn: () =>
      api<ModeCountsResponse>('/statistics/mode-counts', {
        params: { from: filter.from, to: filter.to },
      }),
  });
}

type DeckUsageRow = { deckId: string; count: number };
type DeckUsageResponse = {
  data: { deckUsage: DeckUsageRow[]; opponentDeckUsage: DeckUsageRow[] };
};

export function useDeckUsage(filter: { from: string; to: string }) {
  const query = useQuery({
    queryKey: ['statistics', 'deck-usage', filter],
    queryFn: () =>
      api<DeckUsageResponse>('/statistics/deck-usage', {
        params: { from: filter.from, to: filter.to },
      }),
  });

  const { deckUsage, opponentDeckUsage } = useMemo(() => {
    const raw = query.data?.data;
    if (!raw)
      return { deckUsage: new Map<string, number>(), opponentDeckUsage: new Map<string, number>() };
    return {
      deckUsage: new Map(raw.deckUsage.map((r) => [r.deckId, r.count])),
      opponentDeckUsage: new Map(raw.opponentDeckUsage.map((r) => [r.deckId, r.count])),
    };
  }, [query.data]);

  return { ...query, deckUsage, opponentDeckUsage };
}
