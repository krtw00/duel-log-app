import type { Deck } from '@duel-log/shared';
import { useEffect, useState } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
  editingDeck?: Deck | null;
  loading?: boolean;
};

export function DeckFormDialog({ open, onClose, onSubmit, editingDeck, loading }: Props) {
  const [name, setName] = useState('');

  useEffect(() => {
    setName(editingDeck?.name ?? '');
  }, [editingDeck]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  const handleBackdropKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
        onKeyDown={handleBackdropKeyDown}
        role="button"
        tabIndex={0}
        aria-label="Close dialog"
      />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
        <h2 className="text-lg font-bold mb-4">
          {editingDeck ? 'デッキ名を変更' : 'デッキを追加'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="deckName" className="block text-sm font-medium text-gray-700 mb-1">
              デッキ名
            </label>
            <input
              id="deckName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="デッキ名を入力"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '保存中...' : editingDeck ? '更新' : '追加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
