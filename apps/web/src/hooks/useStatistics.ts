import type {
  DeckWinRate,
  MatchupEntry,
  OverviewStats,
  StatisticsFilter,
  Streaks,
  ValueSequenceEntry,
} from '@duel-log/shared';
import { useQuery } from '@tanstack/react-query';
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
