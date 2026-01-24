import type { GameMode } from '@duel-log/shared';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { demoteRank } from '../../utils/ranks.js';
import { useDecks } from '../../hooks/useDecks.js';
import { useCreateDuel, useDeleteDuel, useDuels, useUpdateDuel } from '../../hooks/useDuels.js';
import { useOverviewStats, useStreaks } from '../../hooks/useStatistics.js';
import { CsvExportButton } from '../csv/CsvExportButton.js';
import { CsvImportDialog } from '../csv/CsvImportDialog.js';
import { ShareStatsDialog } from '../sharing/ShareStatsDialog.js';
import { DashboardHeader } from './DashboardHeader.js';
import { DuelFormDialog } from './DuelFormDialog.js';
import { DuelTable } from './DuelTable.js';
import { StatsDisplayCards } from './StatsDisplayCards.js';
import { StatisticsFilter } from '../statistics/StatisticsFilter.js';
import { StreakBadge } from './StreakBadge.js';
import { StreamerSection } from './StreamerSection.js';

export function DashboardView() {
  const { t } = useTranslation();
  const now = new Date();
  const [gameMode, setGameMode] = useState<GameMode>('RANK');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [deckId, setDeckId] = useState<string | undefined>(undefined);
  const [periodType, setPeriodType] = useState<'all' | 'range'>('all');
  const [rangeStart, setRangeStart] = useState(1);
  const [rangeEnd, setRangeEnd] = useState(30);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [defaultIsFirst, setDefaultIsFirst] = useState(() => {
    const stored = localStorage.getItem('duellog.defaultIsFirst');
    return stored !== null ? stored === 'true' : true;
  });

  // Build date range filter from year/month
  const from = new Date(year, month - 1, 1).toISOString();
  const to = new Date(year, month, 0, 23, 59, 59).toISOString();

  // 2-month window for opponent deck usage sorting (last month + current month)
  const usageFrom = new Date(year, month - 2, 1).toISOString();

  const rangeFilter = periodType === 'range' ? { rangeStart, rangeEnd } : {};
  const filter = { gameMode, from, to, deckId, ...rangeFilter, limit: 100, offset: 0 };
  const allFilter = { from, to, limit: 500, offset: 0 };
  const usageFilter = { from: usageFrom, to, limit: 1000, offset: 0 };
  const statsFilter = { gameMode, from, to, deckId, ...rangeFilter };

  const { data: duelsData, isLoading: duelsLoading } = useDuels(filter);
  const { data: allDuelsData } = useDuels(allFilter);
  const { data: usageDuelsData } = useDuels(usageFilter);
  const { data: decksData, isLoading: decksLoading } = useDecks();
  const { data: overviewData, isLoading: statsLoading } = useOverviewStats(statsFilter);
  const { data: streaksData } = useStreaks(statsFilter);

  const createDuel = useCreateDuel();
  const updateDuel = useUpdateDuel();
  const deleteDuel = useDeleteDuel();

  const duels = duelsData?.data ?? [];
  const allDuels = allDuelsData?.data ?? [];
  const usageDuels = usageDuelsData?.data ?? [];
  const decks = decksData?.data ?? [];

  // Deck usage counts (last month + current month)
  const { deckUsage, opponentDeckUsage } = useMemo(() => {
    const deckCounts = new Map<string, number>();
    const oppCounts = new Map<string, number>();
    for (const duel of usageDuels) {
      if (duel.deckId) {
        deckCounts.set(duel.deckId, (deckCounts.get(duel.deckId) ?? 0) + 1);
      }
      if (duel.opponentDeckId) {
        oppCounts.set(duel.opponentDeckId, (oppCounts.get(duel.opponentDeckId) ?? 0) + 1);
      }
    }
    return { deckUsage: deckCounts, opponentDeckUsage: oppCounts };
  }, [usageDuels]);

  // Latest rank: use this month's data, or demote last saved rank for month start
  const DEFAULT_RANK = 18; // Platinum 5
  const latestRank = useMemo(() => {
    const thisMonthRank = duels.find((d) => d.rank != null)?.rank;
    if (thisMonthRank != null) {
      // Save latest rank for next month reference
      localStorage.setItem('duellog.lastRank', String(thisMonthRank));
      return thisMonthRank;
    }
    // No RANK duels this month: demote last saved rank (月初降格)
    const saved = localStorage.getItem('duellog.lastRank');
    if (saved) {
      return demoteRank(Number(saved));
    }
    return DEFAULT_RANK;
  }, [duels]);

  // Mode counts from all duels in this month (not filtered by game mode)
  const modeCounts = allDuels.reduce<Record<string, number>>((acc, d) => {
    acc[d.gameMode] = (acc[d.gameMode] ?? 0) + 1;
    return acc;
  }, {});

  const handleDelete = (id: string) => {
    deleteDuel.mutate(id);
  };


  return (
    <div className="space-y-6">
      {/* Header: GameMode Tabs + Date Filter */}
      <DashboardHeader
        gameMode={gameMode}
        onGameModeChange={setGameMode}
        year={year}
        month={month}
        onYearChange={setYear}
        onMonthChange={setMonth}
        modeCounts={modeCounts}
      />

      {/* Filter */}
      <StatisticsFilter
        decks={decks}
        deckId={deckId}
        onDeckIdChange={setDeckId}
        periodType={periodType}
        onPeriodTypeChange={(type) => {
          setPeriodType(type);
          if (type === 'range') setRangeEnd(modeCounts[gameMode] ?? 30);
        }}
        rangeStart={rangeStart}
        onRangeStartChange={setRangeStart}
        rangeEnd={rangeEnd}
        onRangeEndChange={setRangeEnd}
        onReset={() => { setDeckId(undefined); setPeriodType('all'); setRangeStart(1); setRangeEnd(modeCounts[gameMode] ?? 30); }}
        totalDuels={modeCounts[gameMode] ?? 30}
      />

      {/* Stats Cards */}
      <StatsDisplayCards stats={overviewData?.data} loading={statsLoading} />

      {/* Stats Popup / OBS Overlay */}
      <StreamerSection />

      {/* Default Settings */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2">
              <path d="M12 3v1m0 16v1m-8-9H3m18 0h-1m-2.636-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707" />
              <circle cx="12" cy="12" r="4" />
            </svg>
            <span className="text-base font-medium" style={{ color: 'var(--color-on-surface)' }}>
              {t('dashboard.defaultSettings')}
            </span>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-on-surface-muted)" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
              <button
                type="button"
                className="px-3 py-1 text-sm font-medium transition-colors"
                style={{
                  background: !defaultIsFirst ? 'var(--color-primary)' : 'transparent',
                  color: !defaultIsFirst ? '#0a0e27' : 'var(--color-on-surface-muted)',
                }}
                onClick={() => { setDefaultIsFirst(false); localStorage.setItem('duellog.defaultIsFirst', 'false'); }}
              >
                {t('duel.second')}
              </button>
              <button
                type="button"
                className="px-3 py-1 text-sm font-medium transition-colors"
                style={{
                  background: defaultIsFirst ? 'var(--color-primary)' : 'transparent',
                  color: defaultIsFirst ? '#0a0e27' : 'var(--color-on-surface-muted)',
                }}
                onClick={() => { setDefaultIsFirst(true); localStorage.setItem('duellog.defaultIsFirst', 'true'); }}
              >
                {t('duel.first')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Inline Form (new duel creation) */}
      <DuelFormDialog
        open={true}
        onClose={() => {}}
        onSubmit={(data) => createDuel.mutate(data)}
        decks={decks}
        loading={createDuel.isPending}
        defaultGameMode={gameMode}
        defaultIsFirst={defaultIsFirst}
        defaultRank={latestRank}
        inline={true}
        deckUsage={deckUsage}
        opponentDeckUsage={opponentDeckUsage}
      />

      {/* Duel History */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 flex items-center justify-between flex-wrap gap-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18" />
                <path d="M9 3v18" />
              </svg>
              <h2 className="text-base font-semibold" style={{ color: 'var(--color-on-surface)' }}>
                {t('dashboard.title')}
              </h2>
            </div>
            <StreakBadge streaks={streaksData?.data} />
          </div>
          <div className="flex items-center gap-2">
            <CsvExportButton gameMode={gameMode} />
            <button
              type="button"
              onClick={() => setImportDialogOpen(true)}
              className="themed-btn themed-btn-outlined-warning text-sm"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span className="hidden sm:inline">{t('common.import')}</span>
            </button>
            <button
              type="button"
              onClick={() => setShareDialogOpen(true)}
              className="themed-btn themed-btn-outlined-success text-sm"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              <span className="hidden sm:inline">{t('sharing.title')}</span>
            </button>
          </div>
        </div>
        <DuelTable
          duels={duels}
          decks={decks}
          loading={duelsLoading || decksLoading}
          onEdit={(duel, data) => updateDuel.mutate({ id: duel.id, data })}
          onDelete={handleDelete}
          gameMode={gameMode}
          defaultIsFirst={defaultIsFirst}
          defaultRank={latestRank}
          editLoading={updateDuel.isPending}
          deckUsage={deckUsage}
          opponentDeckUsage={opponentDeckUsage}
          duelNoOffset={periodType === 'range' ? rangeStart - 1 : 0}
        />
      </div>


      {/* CSV Import */}
      <CsvImportDialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} />

      {/* Share Stats */}
      <ShareStatsDialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} defaultYear={year} defaultMonth={month} defaultGameMode={gameMode} />
    </div>
  );
}
