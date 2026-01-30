import type { Deck } from '@duel-log/shared';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useArchiveAllDecks,
  useArchiveDeck,
  useCreateDeck,
  useDecks,
  useDeleteDeck,
  useUnarchiveDeck,
  useUpdateDeck,
} from '../../hooks/useDecks.js';

type DeckTab = 'my' | 'opponent';

export function DecksView() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<DeckTab>('my');
  const [showArchived, setShowArchived] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingGeneric, setEditingGeneric] = useState(false);
  const [creatingFor, setCreatingFor] = useState<DeckTab | null>(null);
  const [newDeckName, setNewDeckName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const newInputRef = useRef<HTMLInputElement>(null);

  const { data: decksData, isLoading } = useDecks();
  const createDeck = useCreateDeck();
  const updateDeck = useUpdateDeck();
  const archiveDeck = useArchiveDeck();
  const unarchiveDeck = useUnarchiveDeck();
  const deleteDeck = useDeleteDeck();
  const archiveAll = useArchiveAllDecks();

  const allDecks = decksData?.data ?? [];
  const filteredDecks = allDecks.filter((d) => {
    const matchesTab = tab === 'my' ? !d.isOpponentDeck : d.isOpponentDeck;
    const matchesArchive = showArchived || d.active;
    return matchesTab && matchesArchive;
  });
  const myDecks = allDecks.filter((d) => !d.isOpponentDeck && (showArchived || d.active));
  const opponentDecks = allDecks.filter((d) => d.isOpponentDeck && (showArchived || d.active));

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  useEffect(() => {
    if (creatingFor && newInputRef.current) {
      newInputRef.current.focus();
    }
  }, [creatingFor]);

  const handleStartEdit = (deck: Deck) => {
    setEditingId(deck.id);
    setEditingName(deck.name);
    setEditingGeneric(deck.isGeneric);
  };

  const handleSaveEdit = (deckId: string) => {
    const deck = allDecks.find((d) => d.id === deckId);
    if (!deck) {
      setEditingId(null);
      return;
    }
    const trimmedName = editingName.trim();
    const nameChanged = trimmedName && trimmedName !== deck.name;
    const genericChanged = editingGeneric !== deck.isGeneric;
    if (nameChanged || genericChanged) {
      const data: { name?: string; isGeneric?: boolean } = {};
      if (nameChanged) data.name = trimmedName;
      if (genericChanged) data.isGeneric = editingGeneric;
      updateDeck.mutate({ id: deckId, data });
    }
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleStartCreate = (forTab: DeckTab) => {
    setCreatingFor(forTab);
    setNewDeckName('');
  };

  const handleSaveCreate = () => {
    const trimmed = newDeckName.trim();
    if (trimmed) {
      createDeck.mutate(
        { name: trimmed, isOpponentDeck: creatingFor === 'opponent' },
        {
          onSuccess: () => {
            setCreatingFor(null);
            setNewDeckName('');
          },
        },
      );
    } else {
      setCreatingFor(null);
    }
  };

  const handleCancelCreate = () => {
    setCreatingFor(null);
    setNewDeckName('');
  };

  const renderDeckTable = (decks: Deck[], forTab: DeckTab) => {
    if (isLoading) {
      return (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="h-10 rounded animate-pulse"
              style={{ background: 'var(--color-surface-variant)' }}
            />
          ))}
        </div>
      );
    }
    if (decks.length === 0 && creatingFor !== forTab) {
      return (
        <div
          className="glass-card p-8 text-center"
          style={{ color: 'var(--color-on-surface-muted)' }}
        >
          {t('deck.noDecks')}
        </div>
      );
    }
    return (
      <div className="glass-card overflow-hidden">
        <table className="themed-table w-full">
          <thead>
            <tr>
              <th className="text-left">{t('deck.deckName')}</th>
              <th className="text-center" style={{ width: '60px' }}>
                {t('deck.generic')}
              </th>
              <th className="text-center" style={{ width: '120px' }}>
                {t('common.actions')}
              </th>
            </tr>
          </thead>
          <tbody>
            {/* New deck row */}
            {creatingFor === forTab && (
              <tr>
                <td colSpan={3} className="p-0">
                  <div className="flex items-center gap-2 px-3 py-2">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--color-success)"
                      strokeWidth="2"
                    >
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <input
                      ref={newInputRef}
                      type="text"
                      value={newDeckName}
                      onChange={(e) => setNewDeckName(e.target.value)}
                      onBlur={handleSaveCreate}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveCreate();
                        if (e.key === 'Escape') handleCancelCreate();
                      }}
                      className="themed-input flex-1"
                      style={{ padding: '4px 8px', fontSize: '0.875rem' }}
                      placeholder={t('deck.deckName')}
                      maxLength={100}
                    />
                  </div>
                </td>
              </tr>
            )}
            {decks.map((deck) => (
              <tr key={deck.id} className={!deck.active ? 'opacity-50' : ''}>
                {/* Name */}
                <td>
                  {editingId === deck.id ? (
                    <input
                      ref={editInputRef}
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(deck.id);
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                      className="themed-input w-full"
                      style={{ padding: '2px 6px', fontSize: '0.875rem' }}
                      maxLength={100}
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <span
                        className="font-medium truncate"
                        style={{ color: 'var(--color-on-surface)' }}
                      >
                        {deck.name}
                      </span>
                      {!deck.active && <span className="chip text-sm">{t('deck.archive')}</span>}
                    </div>
                  )}
                </td>
                {/* Generic toggle */}
                <td className="text-center">
                  {editingId === deck.id ? (
                    <button
                      type="button"
                      className="themed-btn themed-btn-ghost p-1 mx-auto"
                      style={{
                        color: editingGeneric
                          ? 'var(--color-primary)'
                          : 'var(--color-on-surface-muted)',
                      }}
                      onClick={() => setEditingGeneric((v) => !v)}
                      title={t('deck.genericDesc')}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill={editingGeneric ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M12 2L2 7l10 5 10-5-10-5z" />
                        <path d="M2 17l10 5 10-5" />
                        <path d="M2 12l10 5 10-5" />
                      </svg>
                    </button>
                  ) : deck.isGeneric ? (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="var(--color-primary)"
                      stroke="var(--color-primary)"
                      strokeWidth="2"
                      className="inline-block"
                    >
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      <path d="M2 17l10 5 10-5" />
                      <path d="M2 12l10 5 10-5" />
                    </svg>
                  ) : (
                    <span style={{ color: 'var(--color-on-surface-muted)' }}>-</span>
                  )}
                </td>
                {/* Actions */}
                <td className="text-center whitespace-nowrap">
                  {editingId === deck.id ? (
                    <>
                      <button
                        type="button"
                        className="themed-btn themed-btn-ghost p-1"
                        style={{ color: 'var(--color-success)' }}
                        onClick={() => handleSaveEdit(deck.id)}
                        title={t('common.save')}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="themed-btn themed-btn-ghost p-1"
                        onClick={handleCancelEdit}
                        title={t('common.cancel')}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Edit */}
                      <button
                        type="button"
                        className="themed-btn themed-btn-ghost p-1"
                        onClick={() => handleStartEdit(deck)}
                        title={t('common.edit')}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      {/* Archive/Unarchive */}
                      {deck.active ? (
                        <button
                          type="button"
                          className="themed-btn themed-btn-ghost p-1"
                          style={{ color: 'var(--color-warning)' }}
                          onClick={() => archiveDeck.mutate(deck.id)}
                          title={t('deck.archive')}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
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
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polyline points="1 4 1 10 7 10" />
                            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                          </svg>
                        </button>
                      )}
                      {/* Delete */}
                      {confirmDeleteId === deck.id ? (
                        <>
                          <button
                            type="button"
                            className="themed-btn themed-btn-ghost p-1"
                            style={{ color: 'var(--color-error)' }}
                            onClick={() => {
                              deleteDeck.mutate(deck.id);
                              setConfirmDeleteId(null);
                            }}
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            className="themed-btn themed-btn-ghost p-1"
                            onClick={() => setConfirmDeleteId(null)}
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
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
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-on-bg)' }}>
          {t('deck.title')}
        </h1>
        <div className="flex items-center gap-3">
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
          <button
            type="button"
            onClick={() => {
              if (confirm(t('deck.archiveAllConfirm'))) {
                archiveAll.mutate();
              }
            }}
            className="themed-btn themed-btn-ghost"
            style={{ color: 'var(--color-warning)' }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="21 8 21 21 3 21 3 8" />
              <rect x="1" y="3" width="22" height="5" />
              <line x1="10" y1="12" x2="14" y2="12" />
            </svg>
            {t('deck.archiveAll')}
          </button>
          <button
            type="button"
            onClick={() => handleStartCreate(tab)}
            className="themed-btn themed-btn-primary lg:hidden"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {t('deck.addDeck')}
          </button>
        </div>
      </div>

      {/* Mobile: Tabs */}
      <div className="lg:hidden">
        <div className="flex items-center gap-4 flex-wrap mb-4">
          <div className="tab-bar">
            <button
              type="button"
              className={`tab-item ${tab === 'my' ? 'active' : ''}`}
              onClick={() => setTab('my')}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
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
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" y1="9" x2="9.01" y2="9" />
                <line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
              {t('deck.opponentDecks')}
            </button>
          </div>
        </div>
        {renderDeckTable(filteredDecks, tab)}
      </div>

      {/* Desktop: 2-Column Layout */}
      <div className="hidden lg:grid lg:grid-cols-2 lg:gap-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2
              className="text-sm font-semibold flex items-center gap-2"
              style={{ color: 'var(--color-on-surface)' }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="2"
              >
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M16 3l-4 4-4-4" />
              </svg>
              {t('deck.myDecks')}
            </h2>
            <button
              type="button"
              onClick={() => handleStartCreate('my')}
              className="themed-btn themed-btn-ghost p-1"
              style={{ color: 'var(--color-primary)' }}
              title={t('deck.addDeck')}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
          {renderDeckTable(myDecks, 'my')}
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2
              className="text-sm font-semibold flex items-center gap-2"
              style={{ color: 'var(--color-on-surface)' }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--color-secondary)"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" y1="9" x2="9.01" y2="9" />
                <line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
              {t('deck.opponentDecks')}
            </h2>
            <button
              type="button"
              onClick={() => handleStartCreate('opponent')}
              className="themed-btn themed-btn-ghost p-1"
              style={{ color: 'var(--color-primary)' }}
              title={t('deck.addDeck')}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
          {renderDeckTable(opponentDecks, 'opponent')}
        </div>
      </div>
    </div>
  );
}
