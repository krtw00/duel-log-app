import type { CreateDuel } from '@duel-log/shared';
import { Outlet, useLocation } from '@tanstack/react-router';
import { useState } from 'react';
import { useDecks } from '../../hooks/useDecks.js';
import { useCreateDuel } from '../../hooks/useDuels.js';
import { ToastContainer } from '../common/ToastContainer.js';
import { DuelFormDialog } from '../dashboard/DuelFormDialog.js';
import { AppBar } from './AppBar.js';
import { BottomNav } from './BottomNav.js';

const CHROMELESS_PATHS = ['/streamer-popup'];

export function AppLayout() {
  const location = useLocation();
  const isChromeless = CHROMELESS_PATHS.includes(location.pathname);

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

  if (isChromeless) {
    return <Outlet />;
  }

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
