import { DEFAULT_HANDTRAP_CARDS } from '@duel-log/shared';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { type ResolvedHandtrapCard, getHandtrapName } from '../../utils/handtraps.js';

type Props = {
  open: boolean;
  onClose: () => void;
  selectedHandtraps: string[];
  onToggle: (id: string) => void;
  allHandtrapCards: ResolvedHandtrapCard[];
  hiddenDefaults: string[];
  onToggleHidden: (id: string) => void;
  customHandtrapName: string;
  onCustomHandtrapNameChange: (name: string) => void;
  onAddCustomHandtrap: () => void;
  onDeleteCustomHandtrap: (id: string) => void;
  addingCustom: boolean;
};

export function HandtrapSelectDialog({
  open,
  onClose,
  selectedHandtraps,
  onToggle,
  allHandtrapCards,
  hiddenDefaults,
  onToggleHidden,
  customHandtrapName,
  onCustomHandtrapNameChange,
  onAddCustomHandtrap,
  onDeleteCustomHandtrap,
  addingCustom,
}: Props) {
  const { t, i18n } = useTranslation();
  const hiddenCards = useMemo(
    () => DEFAULT_HANDTRAP_CARDS.filter((card) => hiddenDefaults.includes(card.id)),
    [hiddenDefaults],
  );

  if (!open) return null;

  return (
    <div
      className="dialog-overlay"
      onClick={onClose}
      onKeyDown={(event) => event.key === 'Escape' && onClose()}
      role="button"
      tabIndex={0}
      aria-label={t('common.close')}
    >
      <div
        className="dialog-content"
        style={{ maxWidth: '400px' }}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={() => {}}
        role="dialog"
        aria-modal="true"
        aria-label={t('duel.handtrapSelectTitle')}
        tabIndex={-1}
      >
        <div className="dialog-header">
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-on-surface)' }}>
            {t('duel.handtrapSelectTitle')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="themed-btn themed-btn-ghost p-1"
            aria-label={t('common.close')}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="dialog-body">
          <div className="space-y-4">
            <div className="space-y-1">
              {allHandtrapCards.map((card) => {
                const isCustom = 'isCustom' in card;
                const isSelected = selectedHandtraps.includes(card.id);

                return (
                  <div key={card.id} className="flex items-center justify-between gap-3 py-2 px-1">
                    <label className="flex min-w-0 flex-1 items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggle(card.id)}
                        className="accent-[var(--color-primary)]"
                      />
                      <span
                        className="text-sm truncate"
                        style={{ color: 'var(--color-on-surface)' }}
                      >
                        {getHandtrapName(card, i18n.language)}
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        isCustom ? onDeleteCustomHandtrap(card.id) : onToggleHidden(card.id)
                      }
                      className="themed-btn themed-btn-ghost"
                      aria-label={isCustom ? t('common.delete') : t('duel.handtrapHide')}
                    >
                      {isCustom ? t('common.delete') : t('duel.handtrapHide')}
                    </button>
                  </div>
                );
              })}
            </div>

            {hiddenCards.length > 0 && (
              <div className="space-y-2" style={{ opacity: 0.5 }}>
                <div
                  className="text-sm font-medium"
                  style={{ color: 'var(--color-on-surface-muted)' }}
                >
                  {t('duel.handtrapHiddenSection')}
                </div>
                <div className="space-y-2">
                  {hiddenCards.map((card) => (
                    <div
                      key={card.id}
                      className="flex items-center justify-between gap-3 py-2 px-1"
                    >
                      <span className="text-sm" style={{ color: 'var(--color-on-surface)' }}>
                        {getHandtrapName(card, i18n.language)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onToggleHidden(card.id)}
                        className="themed-btn themed-btn-ghost"
                      >
                        {t('duel.handtrapRestore')}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={customHandtrapName}
                onChange={(event) => onCustomHandtrapNameChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    onAddCustomHandtrap();
                  }
                }}
                placeholder={t('duel.customHandtrapPlaceholder')}
                className="themed-input"
              />
              <button
                type="button"
                onClick={onAddCustomHandtrap}
                disabled={addingCustom || !customHandtrapName.trim()}
                className="themed-btn themed-btn-ghost"
              >
                {t('duel.addCustomHandtrap')}
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="themed-btn themed-btn-primary w-full"
            >
              {t('duel.handtrapDone')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
