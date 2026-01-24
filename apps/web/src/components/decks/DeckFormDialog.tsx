import type { Deck } from '@duel-log/shared';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
  editingDeck?: Deck | null;
  loading?: boolean;
};

export function DeckFormDialog({ open, onClose, onSubmit, editingDeck, loading }: Props) {
  const { t } = useTranslation();
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

  return (
    <div className="dialog-overlay" onClick={onClose} onKeyDown={(e) => e.key === 'Escape' && onClose()} role="button" tabIndex={0} aria-label="Close dialog">
      <div className="dialog-content" onClick={(e) => e.stopPropagation()} onKeyDown={() => {}} role="dialog" tabIndex={-1}>
        <div className="dialog-header">
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-on-surface)' }}>
            {editingDeck ? t('deck.editDeck') : t('deck.addDeck')}
          </h2>
          <button type="button" onClick={onClose} className="themed-btn themed-btn-ghost p-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="dialog-body">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="deckName" className="block text-xs font-medium mb-1" style={{ color: 'var(--color-on-surface-muted)' }}>
                {t('deck.deckName')}
              </label>
              <input
                id="deckName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
                className="themed-input"
                placeholder={t('deck.deckName')}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="themed-btn themed-btn-ghost">
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="themed-btn themed-btn-primary"
              >
                {loading ? t('common.saving') : editingDeck ? t('common.save') : t('common.create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
