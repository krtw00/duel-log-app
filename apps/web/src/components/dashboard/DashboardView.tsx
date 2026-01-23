import type { CreateDuel, Duel, GameMode } from '@duel-log/shared';
import { useState } from 'react';
import { useDecks } from '../../hooks/useDecks.js';
import { useCreateDuel, useDeleteDuel, useDuels, useUpdateDuel } from '../../hooks/useDuels.js';
import { useOverviewStats, useStreaks } from '../../hooks/useStatistics.js';
import { CsvExportButton } from '../csv/CsvExportButton.js';
import { CsvImportDialog } from '../csv/CsvImportDialog.js';
import { DuelFormDialog } from './DuelFormDialog.js';
import { DuelTable } from './DuelTable.js';
import { GameModeTabBar } from './GameModeTabBar.js';
import { StatsDisplayCards } from './StatsDisplayCards.js';
import { StreakBadge } from './StreakBadge.js';

export function DashboardView() {
  const [gameMode, setGameMode] = useState<GameMode | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editingDuel, setEditingDuel] = useState<Duel | null>(null);

  const filter = { gameMode, limit: 50, offset: 0 };
  const statsFilter = { gameMode };

  const { data: duelsData, isLoading: duelsLoading } = useDuels(filter);
  const { data: decksData, isLoading: decksLoading } = useDecks();
  const { data: overviewData, isLoading: statsLoading } = useOverviewStats(statsFilter);
  const { data: streaksData } = useStreaks(statsFilter);

  const createDuel = useCreateDuel();
  const updateDuel = useUpdateDuel();
  const deleteDuel = useDeleteDuel();

  const duels = duelsData?.data ?? [];
  const decks = decksData?.data ?? [];

  const handleOpenCreate = () => {
    setEditingDuel(null);
    setDialogOpen(true);
  };

  const handleEdit = (duel: Duel) => {
    setEditingDuel(duel);
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setEditingDuel(null);
  };

  const handleSubmit = (data: CreateDuel) => {
    if (editingDuel) {
      updateDuel.mutate({ id: editingDuel.id, data }, { onSuccess: () => handleClose() });
    } else {
      createDuel.mutate(data, { onSuccess: () => handleClose() });
    }
  };

  const handleDelete = (id: string) => {
    deleteDuel.mutate(id);
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">ダッシュボード</h1>
          <StreakBadge streaks={streaksData?.data} />
        </div>
        <div className="flex items-center gap-2">
          <CsvExportButton gameMode={gameMode} />
          <button
            type="button"
            onClick={() => setImportDialogOpen(true)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            CSV取込
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            対戦を記録
          </button>
        </div>
      </div>

      {/* 統計カード */}
      <StatsDisplayCards stats={overviewData?.data} loading={statsLoading} />

      {/* ゲームモードタブ */}
      <GameModeTabBar value={gameMode} onChange={setGameMode} />

      {/* 対戦履歴テーブル */}
      <DuelTable
        duels={duels}
        decks={decks}
        loading={duelsLoading || decksLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* 対戦記録ダイアログ */}
      <DuelFormDialog
        open={dialogOpen}
        onClose={handleClose}
        onSubmit={handleSubmit}
        editingDuel={editingDuel}
        decks={decks}
        loading={createDuel.isPending || updateDuel.isPending}
        defaultGameMode={gameMode}
      />

      {/* CSVインポートダイアログ */}
      <CsvImportDialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} />
    </div>
  );
}
