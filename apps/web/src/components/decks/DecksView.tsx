import type { Deck } from '@duel-log/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useArchiveDeck,
  useCreateDeck,
  useDecks,
  useDeleteDeck,
  useUnarchiveDeck,
  useUpdateDeck,
} from '../../hooks/useDecks.js';
import { DeckFormDialog } from './DeckFormDialog.js';

type DeckTab = 'my' | 'opponent';

export function DecksView() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<DeckTab>('my');
  const [showArchived, setShowArchived] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { data: decksData, isLoading } = useDecks();
  const createDeck = useCreateDeck();
  const updateDeck = useUpdateDeck();
  const archiveDeck = useArchiveDeck();
  const unarchiveDeck = useUnarchiveDeck();
  const deleteDeck = useDeleteDeck();

  const allDecks = decksData?.data ?? [];
  const filteredDecks = allDecks.filter((d) => {
    const matchesTab = tab === 'my' ? !d.isOpponentDeck : d.isOpponentDeck;
    const matchesArchive = showArchived || d.active;
    return matchesTab && matchesArchive;
  });

  const handleCreate = () => {
    setEditingDeck(null);
    setDialogOpen(true);
  };

  const handleEdit = (deck: Deck) => {
    setEditingDeck(deck);
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setEditingDeck(null);
  };

  const handleSubmit = (name: string) => {
    if (editingDeck) {
      updateDeck.mutate({ id: editingDeck.id, data: { name } }, { onSuccess: handleClose });
    } else {
      createDeck.mutate({ name, isOpponentDeck: tab === 'opponent' }, { onSuccess: handleClose });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-on-bg)' }}>
          {t('deck.title')}
        </h1>
        <button
          type="button"
          onClick={handleCreate}
          className="themed-btn themed-btn-primary"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {t('deck.addDeck')}
        </button>
      </div>

      {/* Tabs + Archive Toggle */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="tab-bar">
          <button
            type="button"
            className={`tab-item ${tab === 'my' ? 'active' : ''}`}
            onClick={() => setTab('my')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" />
              <path d="M16 3l-4 4-4-4" />
            </svg>
            {t('deck.myDecks')}
          </button>
          <button
            type="button"
            className={`tab-item ${tab === 'opponent' ? 'active' : ''}`}
            onClick={() => setTab('opponent')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
            {t('deck.opponentDecks')}
          </button>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="accent-[var(--color-primary)]"
          />
          <span className="text-sm" style={{ color: 'var(--color-on-surface-muted)' }}>
            {t('deck.showArchived')}
          </span>
        </label>
      </div>

      {/* Deck List */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 rounded animate-pulse" style={{ background: 'var(--color-surface-variant)' }} />
          ))}
        </div>
      ) : filteredDecks.length === 0 ? (
        <div className="glass-card p-8 text-center" style={{ color: 'var(--color-on-surface-muted)' }}>
          {t('deck.noDecks')}
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          {filteredDecks.map((deck, index) => (
            <div
              key={deck.id}
              className={`flex items-center justify-between px-4 py-3 ${!deck.active ? 'opacity-50' : ''}`}
              style={{ borderTop: index > 0 ? '1px solid var(--color-border)' : undefined }}
            >
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" />
                  <path d="M16 3l-4 4-4-4" />
                </svg>
                <span className="font-medium" style={{ color: 'var(--color-on-surface)' }}>{deck.name}</span>
                {!deck.active && (
                  <span className="chip text-xs">{t('deck.archive')}</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="themed-btn themed-btn-ghost p-1"
                  onClick={() => handleEdit(deck)}
                  title={t('common.edit')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                {deck.active ? (
                  <button
                    type="button"
                    className="themed-btn themed-btn-ghost p-1"
                    style={{ color: 'var(--color-warning)' }}
                    onClick={() => archiveDeck.mutate(deck.id)}
                    title={t('deck.archive')}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="21 8 21 21 3 21 3 8" />
                      <rect x="1" y="3" width="22" height="5" />
                      <line x1="10" y1="12" x2="14" y2="12" />
                    </svg>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="themed-btn themed-btn-ghost p-1"
                    style={{ color: 'var(--color-success)' }}
                    onClick={() => unarchiveDeck.mutate(deck.id)}
                    title={t('deck.unarchive')}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="1 4 1 10 7 10" />
                      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                    </svg>
                  </button>
                )}
                {confirmDeleteId === deck.id ? (
                  <>
                    <button
                      type="button"
                      className="themed-btn themed-btn-ghost p-1"
                      style={{ color: 'var(--color-error)' }}
                      onClick={() => { deleteDeck.mutate(deck.id); setConfirmDeleteId(null); }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="themed-btn themed-btn-ghost p-1"
                      onClick={() => setConfirmDeleteId(null)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="themed-btn themed-btn-ghost p-1"
                    style={{ color: 'var(--color-error)' }}
                    onClick={() => setConfirmDeleteId(deck.id)}
                    title={t('common.delete')}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog */}
      <DeckFormDialog
        open={dialogOpen}
        onClose={handleClose}
        onSubmit={handleSubmit}
        editingDeck={editingDeck}
        loading={createDeck.isPending || updateDeck.isPending}
      />
    </div>
  );
}
