import {
  type Deck,
  type DeckWinRate,
  type Duel,
  GAME_MODES,
  type GameMode,
  type MatchupEntry,
  type OverviewStats,
} from '@duel-log/shared';
import { useQuery } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api.js';
import { DuelTable } from '../dashboard/DuelTable.js';
import { StatsDisplayCards } from '../dashboard/StatsDisplayCards.js';
import { DeckDistributionChart } from '../statistics/DeckDistributionChart.js';
import { MatchupMatrix } from '../statistics/MatchupMatrix.js';
import { StatisticsFilter } from '../statistics/StatisticsFilter.js';
import { WinRateTable } from '../statistics/WinRateTable.js';

type SharedDuel = {
  id: string;
  deckId: string;
  deckName: string;
  opponentDeckId: string;
  opponentDeckName: string;
  opponentDeckIsGeneric: boolean;
  result: string;
  gameMode: string;
  isFirst: boolean;
  wonCoinToss: boolean;
  rank: number | null;
  rateValue: number | null;
  dcValue: number | null;
  memo: string | null;
  dueledAt: string;
};

type SharedStatsResponse = {
  data: {
    overview: OverviewStats;
    duels: SharedDuel[];
    displayName: string;
    filters: { from?: string; to?: string; gameMode?: GameMode };
    expiresAt: string | null;
  };
};

function formatPeriodTitle(filters: { from?: string; to?: string }): string {
  if (!filters.from) return '';
  const d = new Date(filters.from);
  return `${d.getFullYear()}年${d.getMonth() + 1}月`;
}

/** クライアント側で対戦データから統計を計算 */
function calculateStats(duels: SharedDuel[]): OverviewStats {
  const total = duels.length;
  if (total === 0) {
    return {
      totalDuels: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      firstRate: 0,
      firstWinRate: 0,
      secondWinRate: 0,
      coinTossWinRate: 0,
    };
  }
  const wins = duels.filter((d) => d.result === 'win').length;
  const losses = total - wins;
  const firstDuels = duels.filter((d) => d.isFirst);
  const secondDuels = duels.filter((d) => !d.isFirst);
  const coinWins = duels.filter((d) => d.wonCoinToss).length;

  return {
    totalDuels: total,
    wins,
    losses,
    winRate: total > 0 ? Math.round((wins / total) * 10000) / 10000 : 0,
    firstRate: total > 0 ? Math.round((firstDuels.length / total) * 10000) / 10000 : 0,
    firstWinRate:
      firstDuels.length > 0
        ? Math.round(
            (firstDuels.filter((d) => d.result === 'win').length / firstDuels.length) * 10000,
          ) / 10000
        : 0,
    secondWinRate:
      secondDuels.length > 0
        ? Math.round(
            (secondDuels.filter((d) => d.result === 'win').length / secondDuels.length) * 10000,
          ) / 10000
        : 0,
    coinTossWinRate: total > 0 ? Math.round((coinWins / total) * 10000) / 10000 : 0,
  };
}

/** クライアント側でデッキ別勝率を計算 */
function calculateWinRates(duels: SharedDuel[]): DeckWinRate[] {
  const map = new Map<string, { deckId: string; deckName: string; wins: number; losses: number }>();
  for (const d of duels) {
    const existing = map.get(d.deckId);
    if (existing) {
      if (d.result === 'win') existing.wins++;
      else existing.losses++;
    } else {
      map.set(d.deckId, {
        deckId: d.deckId,
        deckName: d.deckName,
        wins: d.result === 'win' ? 1 : 0,
        losses: d.result === 'win' ? 0 : 1,
      });
    }
  }
  return Array.from(map.values()).map((entry) => {
    const total = entry.wins + entry.losses;
    return {
      ...entry,
      totalDuels: total,
      winRate: total > 0 ? Math.round((entry.wins / total) * 10000) / 10000 : 0,
    };
  });
}

/** クライアント側で相性表を計算 */
function calculateMatchups(duels: SharedDuel[]): MatchupEntry[] {
  const map = new Map<
    string,
    {
      deckId: string;
      deckName: string;
      opponentDeckId: string;
      opponentDeckName: string;
      opponentDeckIsGeneric: boolean;
      wins: number;
      losses: number;
      firstWins: number;
      firstTotal: number;
      secondWins: number;
      secondTotal: number;
    }
  >();
  for (const d of duels) {
    const key = `${d.deckId}:${d.opponentDeckId}`;
    const existing = map.get(key);
    if (existing) {
      if (d.result === 'win') existing.wins++;
      else existing.losses++;
      if (d.isFirst) {
        existing.firstTotal++;
        if (d.result === 'win') existing.firstWins++;
      } else {
        existing.secondTotal++;
        if (d.result === 'win') existing.secondWins++;
      }
    } else {
      map.set(key, {
        deckId: d.deckId,
        deckName: d.deckName,
        opponentDeckId: d.opponentDeckId,
        opponentDeckName: d.opponentDeckName,
        opponentDeckIsGeneric: d.opponentDeckIsGeneric,
        wins: d.result === 'win' ? 1 : 0,
        losses: d.result === 'win' ? 0 : 1,
        firstWins: d.isFirst && d.result === 'win' ? 1 : 0,
        firstTotal: d.isFirst ? 1 : 0,
        secondWins: !d.isFirst && d.result === 'win' ? 1 : 0,
        secondTotal: !d.isFirst ? 1 : 0,
      });
    }
  }
  return Array.from(map.values()).map((entry) => {
    const total = entry.wins + entry.losses;
    return {
      deckId: entry.deckId,
      deckName: entry.deckName,
      opponentDeckId: entry.opponentDeckId,
      opponentDeckName: entry.opponentDeckName,
      opponentDeckIsGeneric: entry.opponentDeckIsGeneric,
      wins: entry.wins,
      losses: entry.losses,
      winRate: total > 0 ? Math.round((entry.wins / total) * 10000) / 10000 : 0,
      firstWinRate:
        entry.firstTotal > 0 ? Math.round((entry.firstWins / entry.firstTotal) * 10000) / 10000 : 0,
      secondWinRate:
        entry.secondTotal > 0
          ? Math.round((entry.secondWins / entry.secondTotal) * 10000) / 10000
          : 0,
    };
  });
}

type ViewMode = 'dashboard' | 'statistics';

export function SharedStatisticsView() {
  const { t } = useTranslation();
  const { token } = useParams({ strict: false }) as { token: string };
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [selectedGameMode, setSelectedGameMode] = useState<GameMode | null>(null);
  const [deckId, setDeckId] = useState<string | undefined>(undefined);
  const [periodType, setPeriodType] = useState<'all' | 'range'>('all');
  const [rangeStart, setRangeStart] = useState(1);
  const [rangeEnd, setRangeEnd] = useState(30);

  const { data, isLoading, error } = useQuery({
    queryKey: ['shared-statistics', token],
    queryFn: () => api<SharedStatsResponse>(`/shared-statistics/${token}`),
    enabled: !!token,
  });

  // ゲームモード別の対戦数
  const modeCounts = useMemo(() => {
    if (!data?.data.duels) return {} as Record<string, number>;
    return data.data.duels.reduce<Record<string, number>>((acc, d) => {
      acc[d.gameMode] = (acc[d.gameMode] ?? 0) + 1;
      return acc;
    }, {});
  }, [data]);

  // データがあるゲームモードのみ表示
  const availableModes = useMemo(() => {
    return GAME_MODES.filter((mode) => (modeCounts[mode] ?? 0) > 0);
  }, [modeCounts]);

  // 初回データ取得時にデフォルトモード設定
  const activeMode = useMemo(() => {
    if (data?.data.filters.gameMode) return data.data.filters.gameMode;
    if (selectedGameMode && availableModes.includes(selectedGameMode)) return selectedGameMode;
    return availableModes[0] ?? 'RANK';
  }, [data, selectedGameMode, availableModes]);

  // モード内の総対戦数（スライダー用）
  const totalDuelsInMode = useMemo(() => {
    if (!data?.data.duels) return 30;
    if (data.data.filters.gameMode) return data.data.duels.length;
    return data.data.duels.filter((d) => d.gameMode === activeMode).length;
  }, [data, activeMode]);

  // フィルタ済みの対戦データ
  const filteredDuels = useMemo(() => {
    if (!data?.data.duels) return [];
    let duels = data.data.duels;
    // フィルターにgameModeが指定されていない場合はクライアント側でフィルタ
    if (!data.data.filters.gameMode) {
      duels = duels.filter((d) => d.gameMode === activeMode);
    }
    // レンジフィルター（対戦番号で絞り込み、古い順で1始まり）
    if (periodType === 'range') {
      const sorted = [...duels].sort(
        (a, b) => new Date(a.dueledAt).getTime() - new Date(b.dueledAt).getTime(),
      );
      duels = sorted.slice(rangeStart - 1, rangeEnd);
    }
    // デッキフィルター
    if (deckId) {
      duels = duels.filter((d) => d.deckId === deckId);
    }
    return duels;
  }, [data, activeMode, deckId, periodType, rangeStart, rangeEnd]);

  // フィルタ済みデータから統計計算
  const filteredStats = useMemo(() => {
    return calculateStats(filteredDuels);
  }, [filteredDuels]);

  // デッキ別勝率（クライアント側計算）
  const filteredWinRates = useMemo(() => {
    return calculateWinRates(filteredDuels);
  }, [filteredDuels]);

  // 相性表（クライアント側計算）
  const filteredMatchups = useMemo(() => {
    return calculateMatchups(filteredDuels);
  }, [filteredDuels]);

  // フィルター用のデッキリスト（使用デッキのみ）
  const decksForFilter = useMemo<Deck[]>(() => {
    if (!data?.data.duels) return [];
    const deckMap = new Map<string, string>();
    for (const d of data.data.duels) {
      if (!deckMap.has(d.deckId)) deckMap.set(d.deckId, d.deckName);
    }
    const now = new Date().toISOString();
    return Array.from(deckMap.entries()).map(([id, name]) => ({
      id,
      userId: '',
      name,
      isOpponentDeck: false,
      isGeneric: false,
      active: true,
      createdAt: now,
      updatedAt: now,
    }));
  }, [data]);

  // DuelTable用にDeck[]を構築
  const decksForTable = useMemo<Deck[]>(() => {
    const deckMap = new Map<string, string>();
    for (const d of filteredDuels) {
      if (!deckMap.has(d.deckId)) deckMap.set(d.deckId, d.deckName);
      if (!deckMap.has(d.opponentDeckId)) deckMap.set(d.opponentDeckId, d.opponentDeckName);
    }
    const now = new Date().toISOString();
    return Array.from(deckMap.entries()).map(([id, name]) => ({
      id,
      userId: '',
      name,
      isOpponentDeck: false,
      isGeneric: false,
      active: true,
      createdAt: now,
      updatedAt: now,
    }));
  }, [filteredDuels]);

  // DuelTable用にDuel[]として変換
  const duelsForTable = useMemo<Duel[]>(() => {
    const now = new Date().toISOString();
    return filteredDuels.map((d) => ({
      id: d.id,
      userId: '',
      deckId: d.deckId,
      opponentDeckId: d.opponentDeckId,
      result: d.result as 'win' | 'loss',
      gameMode: d.gameMode as GameMode,
      isFirst: d.isFirst,
      wonCoinToss: d.wonCoinToss,
      rank: d.rank,
      rateValue: d.rateValue,
      dcValue: d.dcValue,
      memo: d.memo,
      dueledAt: d.dueledAt,
      createdAt: now,
      updatedAt: now,
    }));
  }, [filteredDuels]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin mx-auto mb-4" />
          <p style={{ color: 'var(--color-on-surface-muted)' }}>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-6">
        <div className="glass-card p-8 max-w-md w-full text-center">
          <div className="mb-4" style={{ color: 'var(--color-error)' }}>
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--color-error)' }}>
            {t('common.error')}
          </h1>
          <p style={{ color: 'var(--color-on-surface-muted)' }}>{t('sharing.invalidLink')}</p>
        </div>
      </div>
    );
  }

  const { displayName, filters } = data.data;
  const periodTitle = formatPeriodTitle(filters);
  const showGameModeTabs = !filters.gameMode && availableModes.length > 0;

  const handleModeChange = (mode: GameMode) => {
    setSelectedGameMode(mode);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(0, 217, 255, 0.15)' }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--color-primary)"
                  strokeWidth="1.5"
                >
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold" style={{ color: 'var(--color-on-surface)' }}>
                  {periodTitle ? `${periodTitle}の統計データ` : t('sharing.sharedStatistics')}
                </h1>
                <p className="text-sm" style={{ color: 'var(--color-on-surface-muted)' }}>
                  {t('sharing.statsOf', { name: displayName })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Game Mode Tabs */}
        {showGameModeTabs && (
          <div className="glass-card p-2">
            <div className="flex gap-1 overflow-x-auto">
              {availableModes.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className="tab-item"
                  style={{
                    background: activeMode === mode ? 'var(--color-primary)' : 'transparent',
                    color: activeMode === mode ? '#0a0e27' : 'var(--color-on-surface-muted)',
                    borderColor:
                      activeMode === mode ? 'var(--color-primary)' : 'var(--color-border)',
                  }}
                  onClick={() => handleModeChange(mode)}
                >
                  <span className="text-sm font-medium">{t(`gameMode.${mode}`)}</span>
                  {(modeCounts[mode] ?? 0) > 0 && (
                    <span
                      className="ml-1.5 px-1.5 py-0.5 rounded-full text-sm font-semibold"
                      style={{
                        background:
                          activeMode === mode
                            ? 'rgba(10, 14, 39, 0.2)'
                            : 'var(--color-surface-variant)',
                        color: activeMode === mode ? '#0a0e27' : 'var(--color-on-surface-muted)',
                      }}
                    >
                      {modeCounts[mode]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* View Mode Toggle */}
        <div className="flex gap-1">
          <button
            type="button"
            className="tab-item"
            style={{
              background: viewMode === 'dashboard' ? 'var(--color-primary)' : 'transparent',
              color: viewMode === 'dashboard' ? '#0a0e27' : 'var(--color-on-surface-muted)',
              borderColor:
                viewMode === 'dashboard' ? 'var(--color-primary)' : 'var(--color-border)',
            }}
            onClick={() => setViewMode('dashboard')}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            <span className="text-sm font-medium">{t('nav.dashboard')}</span>
          </button>
          <button
            type="button"
            className="tab-item"
            style={{
              background: viewMode === 'statistics' ? 'var(--color-primary)' : 'transparent',
              color: viewMode === 'statistics' ? '#0a0e27' : 'var(--color-on-surface-muted)',
              borderColor:
                viewMode === 'statistics' ? 'var(--color-primary)' : 'var(--color-border)',
            }}
            onClick={() => setViewMode('statistics')}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            <span className="text-sm font-medium">{t('nav.statistics')}</span>
          </button>
        </div>

        {/* Filter */}
        <StatisticsFilter
          decks={decksForFilter}
          deckId={deckId}
          onDeckIdChange={setDeckId}
          periodType={periodType}
          onPeriodTypeChange={(type) => {
            setPeriodType(type);
            if (type === 'range') setRangeEnd(totalDuelsInMode);
          }}
          rangeStart={rangeStart}
          onRangeStartChange={setRangeStart}
          rangeEnd={rangeEnd}
          onRangeEndChange={setRangeEnd}
          onReset={() => {
            setDeckId(undefined);
            setPeriodType('all');
            setRangeStart(1);
            setRangeEnd(totalDuelsInMode);
          }}
          totalDuels={totalDuelsInMode}
        />

        {/* Stats Cards */}
        <StatsDisplayCards stats={filteredStats} loading={false} />

        {/* Dashboard View */}
        {viewMode === 'dashboard' && (
          <div className="glass-card overflow-hidden">
            <div
              className="p-4 flex items-center gap-2"
              style={{ borderBottom: '1px solid var(--color-border)' }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18" />
                <path d="M9 3v18" />
              </svg>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--color-on-surface)' }}>
                {t('dashboard.title')}
              </h2>
            </div>
            <DuelTable
              duels={duelsForTable}
              decks={decksForTable}
              loading={false}
              readOnly
              duelNoOffset={periodType === 'range' ? rangeStart - 1 : 0}
            />
          </div>
        )}

        {/* Statistics View */}
        {viewMode === 'statistics' && (
          <div className="space-y-6">
            {/* 2-Column Layout: Distribution + Duel Table */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Deck Distribution Chart */}
              <div className="glass-card p-4 flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--color-primary)"
                    strokeWidth="2"
                  >
                    <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                    <path d="M22 12A10 10 0 0 0 12 2v10z" />
                  </svg>
                  <h2
                    className="text-sm font-semibold"
                    style={{ color: 'var(--color-on-surface)' }}
                  >
                    {t('statistics.deckDistribution')}
                  </h2>
                </div>
                <div className="flex-1">
                  <DeckDistributionChart matchups={filteredMatchups} loading={false} />
                </div>
              </div>

              {/* Duel Table */}
              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--color-primary)"
                    strokeWidth="2"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18" />
                    <path d="M9 3v18" />
                  </svg>
                  <h2
                    className="text-sm font-semibold"
                    style={{ color: 'var(--color-on-surface)' }}
                  >
                    {t('statistics.monthlyDuels')}
                  </h2>
                </div>
                <DuelTable
                  duels={duelsForTable}
                  decks={decksForTable}
                  loading={false}
                  readOnly
                  maxHeight="480px"
                  duelNoOffset={periodType === 'range' ? rangeStart - 1 : 0}
                />
              </div>
            </div>

            {/* Win Rate by Deck */}
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--color-success)"
                  strokeWidth="2"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
                <h2 className="text-sm font-semibold" style={{ color: 'var(--color-on-surface)' }}>
                  {t('statistics.winRateByDeck')}
                </h2>
              </div>
              <WinRateTable winRates={filteredWinRates} loading={false} />
            </div>

            {/* Matchup Matrix */}
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--color-secondary)"
                  strokeWidth="2"
                >
                  <path d="M18 6L6 18" />
                  <path d="M6 6l12 12" />
                </svg>
                <h2 className="text-sm font-semibold" style={{ color: 'var(--color-on-surface)' }}>
                  {t('statistics.matchupMatrix')}
                </h2>
              </div>
              <MatchupMatrix matchups={filteredMatchups} loading={false} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
