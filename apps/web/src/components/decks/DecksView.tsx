import type { Deck } from '@duel-log/shared';
import { useState } from 'react';
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
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">デッキ管理</h1>
        <button
          type="button"
          onClick={handleCreate}
          className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          デッキを追加
        </button>
      </div>

      {/* タブ */}
      <div className="flex items-center gap-4">
        <div className="flex gap-1 border-b border-gray-200">
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === 'my'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setTab('my')}
          >
            自分のデッキ
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === 'opponent'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setTab('opponent')}
          >
            相手デッキ
          </button>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
          />
          アーカイブ済みも表示
        </label>
      </div>

      {/* デッキ一覧 */}
      {isLoading ? (
        <div className="space-y-2">
          {['s1', 's2', 's3'].map((id) => (
            <div key={id} className="h-14 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : filteredDecks.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          デッキがありません。上のボタンから追加してください。
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow divide-y">
          {filteredDecks.map((deck) => (
            <div
              key={deck.id}
              className={`flex items-center justify-between px-4 py-3 ${!deck.active ? 'opacity-50' : ''}`}
            >
              <div>
                <span className="font-medium text-gray-900">{deck.name}</span>
                {!deck.active && (
                  <span className="ml-2 text-xs text-gray-400">(アーカイブ済み)</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-800 text-xs"
                  onClick={() => handleEdit(deck)}
                >
                  編集
                </button>
                {deck.active ? (
                  <button
                    type="button"
                    className="text-yellow-600 hover:text-yellow-800 text-xs"
                    onClick={() => archiveDeck.mutate(deck.id)}
                  >
                    アーカイブ
                  </button>
                ) : (
                  <button
                    type="button"
                    className="text-green-600 hover:text-green-800 text-xs"
                    onClick={() => unarchiveDeck.mutate(deck.id)}
                  >
                    復元
                  </button>
                )}
                {confirmDeleteId === deck.id ? (
                  <>
                    <button
                      type="button"
                      className="text-red-600 hover:text-red-800 text-xs"
                      onClick={() => {
                        deleteDeck.mutate(deck.id);
                        setConfirmDeleteId(null);
                      }}
                    >
                      確定
                    </button>
                    <button
                      type="button"
                      className="text-gray-500 hover:text-gray-700 text-xs"
                      onClick={() => setConfirmDeleteId(null)}
                    >
                      取消
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="text-red-600 hover:text-red-800 text-xs"
                    onClick={() => setConfirmDeleteId(deck.id)}
                  >
                    削除
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ダイアログ */}
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
