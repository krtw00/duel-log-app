import { Outlet } from '@tanstack/react-router';
import { useState } from 'react';
import { DuelFormDialog } from '../dashboard/DuelFormDialog.js';
import { useDecks } from '../../hooks/useDecks.js';
import { useCreateDuel } from '../../hooks/useDuels.js';
import type { CreateDuel } from '@duel-log/shared';
import { ToastContainer } from '../common/ToastContainer.js';
import { AppBar } from './AppBar.js';
import { BottomNav } from './BottomNav.js';

export function AppLayout() {
  const [fabDialogOpen, setFabDialogOpen] = useState(false);
  const { data: decksData } = useDecks();
  const createDuel = useCreateDuel();

  const decks = decksData?.data ?? [];

  const handleFabClick = () => {
    setFabDialogOpen(true);
  };

  const handleFabSubmit = (data: CreateDuel) => {
    createDuel.mutate(data, { onSuccess: () => setFabDialogOpen(false) });
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <AppBar />

      {/* Main Content - offset for fixed header */}
      <main className="px-4 py-6 pt-20 pb-24 md:pb-6">
        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      <BottomNav onFabClick={handleFabClick} />

      {/* FAB Dialog (mobile) */}
      <DuelFormDialog
        open={fabDialogOpen}
        onClose={() => setFabDialogOpen(false)}
        onSubmit={handleFabSubmit}
        editingDuel={null}
        decks={decks}
        loading={createDuel.isPending}
      />

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}
