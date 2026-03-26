import type { GameMode, User } from '@duel-log/shared';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDecks } from '../../hooks/useDecks.js';
import { useDuels } from '../../hooks/useDuels.js';
import { useUserHandtrapCards } from '../../hooks/useHandtrapCards.js';
import {
  useHandtrapStats,
  useMatchups,
  useValueSequence,
  useWinRates,
} from '../../hooks/useStatistics.js';
import { api } from '../../lib/api.js';
import { getCurrentSeason, getSeasonRange } from '../../utils/season.js';
import { DateFilterBar } from '../dashboard/DateFilterBar.js';
import { DuelTable } from '../dashboard/DuelTable.js';
import { GameModeTabBar } from '../dashboard/GameModeTabBar.js';
import { DeckDistributionChart } from './DeckDistributionChart.js';
import { HandtrapStats } from './HandtrapStats.js';
import { MatchupMatrix } from './MatchupMatrix.js';
import { StatisticsFilter } from './StatisticsFilter.js';
import { ValueSequenceChart } from './ValueSequenceChart.js';
import { WinRateTable } from './WinRateTable.js';

export function StatisticsView() {
  const { t } = useTranslation();
  const currentSeason = getCurrentSeason();
  const [gameMode, setGameMode] = useState<GameMode>('RANK');
  const [subTab, setSubTab] = useState<'winRate' | 'deckDistribution' | 'trend' | 'handtraps'>(
    'deckDistribution',
  );
  const [year, setYear] = useState(currentSeason.year);
  const [month, setMonth] = useState(currentSeason.month);
  const [deckId, setDeckId] = useState<string | undefined>(undefined);
  const [periodType, setPeriodType] = useState<'all' | 'range'>('all');
  const [rangeStart, setRangeStart] = useState(1);
  const [rangeEnd, setRangeEnd] = useState(30);
  const { data: meData } = useQuery({
    queryKey: ['me'],
    queryFn: () => api<{ data: User }>('/me'),
    staleTime: 1000 * 60 * 5,
  });

  const { from, to } = getSeasonRange(year, month);

  const rangeFilter = periodType === 'range' ? { rangeStart, rangeEnd } : {};
  const filter = { gameMode, from, to, deckId, ...rangeFilter };
  const valueFilter =
    gameMode === 'RATE' || gameMode === 'DC'
      ? { gameMode, from, to, deckId, ...rangeFilter }
      : undefined;

  const { data: winRatesData, isLoading: winRatesLoading } = useWinRates(filter);
  const { data: matchupsData, isLoading: matchupsLoading } = useMatchups(filter);
  const { data: handtrapStatsData, isLoading: handtrapStatsLoading } = useHandtrapStats(filter);
  const { data: customHandtrapCardsData } = useUserHandtrapCards();
  const { data: valueData, isLoading: valueLoading } = useValueSequence(
    valueFilter as { gameMode: 'RATE' | 'DC'; from?: string; to?: string } | undefined,
  );
  const { data: decksData } = useDecks();
  const { data: duelsData, isLoading: duelsLoading } = useDuels({
    gameMode,
    from,
    to,
    deckId,
    ...rangeFilter,
    limit: 500,
    offset: 0,
  });
  const { data: totalData } = useDuels({ gameMode, from, to, limit: 1, offset: 0 });

  const decks = decksData?.data ?? [];
  const duels = duelsData?.data ?? [];
  const totalDuelsForMode = totalData?.pagination?.total ?? 30;
  const classicLayout = meData?.data?.classicLayout ?? false;
  const customHandtrapCards = customHandtrapCardsData?.data ?? [];

  return (
    <div className="space-y-6">
      {/* Title */}
      <h1 className="text-2xl font-bold" style={{ color: 'var(--color-on-bg)' }}>
        {t('statistics.title')}
      </h1>

      {/* Year/Month Filter */}
      <DateFilterBar year={year} month={month} onYearChange={setYear} onMonthChange={setMonth} />

      {/* Statistics Filter */}
      <StatisticsFilter
        decks={decks}
        deckId={deckId}
        onDeckIdChange={setDeckId}
        periodType={periodType}
        onPeriodTypeChange={(type) => {
          setPeriodType(type);
          if (type === 'range') setRangeEnd(totalDuelsForMode);
        }}
        rangeStart={rangeStart}
        onRangeStartChange={setRangeStart}
        rangeEnd={rangeEnd}
        onRangeEndChange={setRangeEnd}
        onReset={() => {
          setDeckId(undefined);
          setPeriodType('all');
          setRangeStart(1);
          setRangeEnd(totalDuelsForMode);
        }}
        totalDuels={totalDuelsForMode}
      />

      {/* Game Mode Tabs */}
      <div className="glass-card p-3">
        <GameModeTabBar value={gameMode} onChange={setGameMode} />
      </div>

      {!classicLayout && (
        <div className="glass-card p-3">
          <div className="tab-bar">
            <button
              type="button"
              className={`tab-item ${subTab === 'deckDistribution' ? 'active' : ''}`}
              onClick={() => setSubTab('deckDistribution')}
            >
              {t('statistics.tabDeckDistribution')}
            </button>
            <button
              type="button"
              className={`tab-item ${subTab === 'winRate' ? 'active' : ''}`}
              onClick={() => setSubTab('winRate')}
            >
              {t('statistics.tabWinRate')}
            </button>
            <button
              type="button"
              className={`tab-item ${subTab === 'trend' ? 'active' : ''}`}
              onClick={() => setSubTab('trend')}
            >
              {t('statistics.tabTrend')}
            </button>
            <button
              type="button"
              className={`tab-item ${subTab === 'handtraps' ? 'active' : ''}`}
              onClick={() => setSubTab('handtraps')}
            >
              {t('statistics.tabHandtraps')}
            </button>
          </div>
        </div>
      )}

      {(classicLayout || subTab === 'deckDistribution') && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="glass-card flex flex-col p-4">
            <div className="mb-3 flex items-center gap-2">
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
              <h2 className="text-sm font-semibold" style={{ color: 'var(--color-on-surface)' }}>
                {t('statistics.deckDistribution')}
              </h2>
            </div>
            <div className="flex-1">
              <DeckDistributionChart
                matchups={matchupsData?.data ?? []}
                loading={matchupsLoading}
              />
            </div>
          </div>

          <div className="glass-card p-4">
            <div className="mb-3 flex items-center gap-2">
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
              <h2 className="text-sm font-semibold" style={{ color: 'var(--color-on-surface)' }}>
                {t('statistics.monthlyDuels')}
              </h2>
            </div>
            <DuelTable
              duels={duels}
              decks={decks}
              loading={duelsLoading}
              readOnly
              maxHeight="480px"
              duelNoOffset={periodType === 'range' ? rangeStart - 1 : 0}
            />
          </div>
        </div>
      )}

      {(classicLayout || subTab === 'winRate') && (
        <>
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
            <WinRateTable winRates={winRatesData?.data ?? []} loading={winRatesLoading} />
          </div>

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
            <MatchupMatrix matchups={matchupsData?.data ?? []} loading={matchupsLoading} />
          </div>
        </>
      )}

      {(classicLayout || subTab === 'trend') && (
        <div className="glass-card p-4">
          {gameMode === 'RATE' || gameMode === 'DC' ? (
            <>
              <div className="mb-3 flex items-center gap-2">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--color-primary)"
                  strokeWidth="2"
                >
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                <h2 className="text-sm font-semibold" style={{ color: 'var(--color-on-surface)' }}>
                  {t('statistics.valueSequence')}
                </h2>
              </div>
              <ValueSequenceChart
                data={valueData?.data ?? []}
                gameMode={gameMode}
                loading={valueLoading}
              />
            </>
          ) : (
            <p className="py-8 text-center" style={{ color: 'var(--color-on-surface-muted)' }}>
              {t('statistics.trendNotAvailable')}
            </p>
          )}
        </div>
      )}

      {(classicLayout || subTab === 'handtraps') && (
        <div className="glass-card p-4">
          <HandtrapStats
            stats={handtrapStatsData?.data ?? []}
            customCards={customHandtrapCards}
            loading={handtrapStatsLoading}
          />
        </div>
      )}
    </div>
  );
}
