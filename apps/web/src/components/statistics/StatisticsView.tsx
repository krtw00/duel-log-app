import type { GameMode } from '@duel-log/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDecks } from '../../hooks/useDecks.js';
import { useDuels } from '../../hooks/useDuels.js';
import { useMatchups, useValueSequence, useWinRates } from '../../hooks/useStatistics.js';
import { DateFilterBar } from '../dashboard/DateFilterBar.js';
import { DuelTable } from '../dashboard/DuelTable.js';
import { GameModeTabBar } from '../dashboard/GameModeTabBar.js';
import { DeckDistributionChart } from './DeckDistributionChart.js';
import { MatchupMatrix } from './MatchupMatrix.js';
import { StatisticsFilter } from './StatisticsFilter.js';
import { ValueSequenceChart } from './ValueSequenceChart.js';
import { WinRateTable } from './WinRateTable.js';

export function StatisticsView() {
  const { t } = useTranslation();
  const now = new Date();
  const [gameMode, setGameMode] = useState<GameMode>('RANK');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [deckId, setDeckId] = useState<string | undefined>(undefined);
  const [periodType, setPeriodType] = useState<'all' | 'range'>('all');
  const [rangeStart, setRangeStart] = useState(1);
  const [rangeEnd, setRangeEnd] = useState(30);

  const from = new Date(year, month - 1, 1).toISOString();
  const to = new Date(year, month, 0, 23, 59, 59).toISOString();

  const rangeFilter = periodType === 'range' ? { rangeStart, rangeEnd } : {};
  const filter = { gameMode, from, to, deckId, ...rangeFilter };
  const valueFilter = (gameMode === 'RATE' || gameMode === 'DC') ? { gameMode, from, to, deckId, ...rangeFilter } : undefined;

  const { data: winRatesData, isLoading: winRatesLoading } = useWinRates(filter);
  const { data: matchupsData, isLoading: matchupsLoading } = useMatchups(filter);
  const { data: valueData, isLoading: valueLoading } = useValueSequence(
    valueFilter as { gameMode: 'RATE' | 'DC'; from?: string; to?: string } | undefined,
  );
  const { data: decksData } = useDecks();
  const { data: duelsData, isLoading: duelsLoading } = useDuels({ gameMode, from, to, deckId, ...rangeFilter, limit: 500, offset: 0 });
  const { data: totalData } = useDuels({ gameMode, from, to, limit: 1, offset: 0 });

  const decks = decksData?.data ?? [];
  const duels = duelsData?.data ?? [];
  const totalDuelsForMode = totalData?.pagination?.total ?? 30;

  return (
    <div className="space-y-6">
      {/* Title */}
      <h1 className="text-2xl font-bold" style={{ color: 'var(--color-on-bg)' }}>
        {t('statistics.title')}
      </h1>

      {/* Year/Month Filter */}
      <DateFilterBar
        year={year}
        month={month}
        onYearChange={setYear}
        onMonthChange={setMonth}
      />

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
        onReset={() => { setDeckId(undefined); setPeriodType('all'); setRangeStart(1); setRangeEnd(totalDuelsForMode); }}
        totalDuels={totalDuelsForMode}
      />

      {/* Game Mode Tabs */}
      <div className="glass-card p-3">
        <GameModeTabBar value={gameMode} onChange={setGameMode} />
      </div>

      {/* 2-Column Layout: Distribution + Duel Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Opponent Deck Distribution (Pie Chart) */}
        <div className="glass-card p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2">
              <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
              <path d="M22 12A10 10 0 0 0 12 2v10z" />
            </svg>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--color-on-surface)' }}>
              {t('statistics.deckDistribution')}
            </h2>
          </div>
          <div className="flex-1">
            <DeckDistributionChart matchups={matchupsData?.data ?? []} loading={matchupsLoading} />
          </div>
        </div>

        {/* Monthly Duel List */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2">
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

      {/* Win Rate by Deck (Full Width) */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--color-on-surface)' }}>
            {t('statistics.winRateByDeck')}
          </h2>
        </div>
        <WinRateTable winRates={winRatesData?.data ?? []} loading={winRatesLoading} />
      </div>

      {/* Matchup Table (Full Width) */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-secondary)" strokeWidth="2">
            <path d="M18 6L6 18" />
            <path d="M6 6l12 12" />
          </svg>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--color-on-surface)' }}>
            {t('statistics.matchupMatrix')}
          </h2>
        </div>
        <MatchupMatrix matchups={matchupsData?.data ?? []} loading={matchupsLoading} />
      </div>

      {/* Value Sequence Chart (RATE/DC only) */}
      {valueFilter && (
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--color-on-surface)' }}>
              {t('statistics.valueSequence')}
            </h2>
          </div>
          <ValueSequenceChart
            data={valueData?.data ?? []}
            gameMode={valueFilter.gameMode}
            loading={valueLoading}
          />
        </div>
      )}
    </div>
  );
}
