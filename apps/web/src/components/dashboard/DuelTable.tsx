import type { Deck, Duel } from '@duel-log/shared';
import type { TFunction } from 'i18next';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getRankLabel } from '../../utils/ranks.js';

type Props = {
  duels: Duel[];
  decks: Deck[];
  loading: boolean;
  onEdit?: (duel: Duel) => void;
  onDelete?: (id: string) => void;
  maxHeight?: string;
  readOnly?: boolean;
};

function getDeckName(decks: Deck[], deckId: string): string {
  return decks.find((d) => d.id === deckId)?.name ?? '-';
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}/${month}/${day} ${hours}:${minutes}`;
}

function getRankDisplay(duel: Duel, t: TFunction): string | null {
  if (duel.gameMode === 'RANK' && duel.rank != null) return getRankLabel(duel.rank, t);
  if (duel.gameMode === 'RATE' && duel.rateValue != null) return String(duel.rateValue);
  if (duel.gameMode === 'DC' && duel.dcValue != null) return `DC${duel.dcValue}`;
  return null;
}

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50] as const;
const DEFAULT_ITEMS_PER_PAGE = 10;

function MobileCardView({ duels, decks, onEdit, onDelete, readOnly }: Omit<Props, 'loading' | 'maxHeight'>) {
  const { t } = useTranslation();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  return (
    <div className="sm:hidden">
      {duels.map((duel) => (
        <div key={duel.id} className="duel-card-compact">
          {/* Result indicator bar */}
          <div className={`duel-card-indicator ${duel.result === 'win' ? 'duel-card-indicator-win' : 'duel-card-indicator-loss'}`} />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 min-w-0 flex-1">
                <span className="chip chip-outlined-primary text-xs truncate">{getDeckName(decks, duel.deckId)}</span>
                <span className="text-xs" style={{ color: 'var(--color-on-surface-muted)' }}>vs</span>
                <span className="chip chip-outlined-warning text-xs truncate">{getDeckName(decks, duel.opponentDeckId)}</span>
              </div>
              <span className="text-xs whitespace-nowrap" style={{ color: 'var(--color-on-surface-muted)' }}>
                {formatDate(duel.dueledAt)}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1 flex-wrap">
              <span className={`chip text-xs ${duel.result === 'win' ? 'chip-success' : 'chip-error'}`}>
                {duel.result === 'win' ? t('duel.win') : t('duel.loss')}
              </span>
              <span className={`chip text-xs ${duel.wonCoinToss ? 'chip-coin-win' : 'chip-coin-loss'}`}>
                {duel.wonCoinToss ? t('duel.coinTossWin') : t('duel.coinTossLoss')}
              </span>
              <span className={`chip text-xs ${duel.isFirst ? 'chip-outlined-info' : 'chip-outlined-secondary'}`}>
                {duel.isFirst ? t('duel.first') : t('duel.second')}
              </span>
              {getRankDisplay(duel, t) && (
                <span className="chip text-xs chip-rank">{getRankDisplay(duel, t)}</span>
              )}
              {duel.memo && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-on-surface-muted)" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              )}
            </div>
          </div>

          {/* Actions */}
          {!readOnly && onEdit && onDelete && (
          <div className="flex flex-col justify-center gap-1">
            <button
              type="button"
              className="themed-btn themed-btn-ghost p-1"
              onClick={() => onEdit(duel)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            {confirmDeleteId === duel.id ? (
              <button
                type="button"
                className="themed-btn themed-btn-ghost p-1"
                style={{ color: 'var(--color-error)' }}
                onClick={() => { onDelete(duel.id); setConfirmDeleteId(null); }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                className="themed-btn themed-btn-ghost p-1"
                style={{ color: 'var(--color-error)' }}
                onClick={() => setConfirmDeleteId(duel.id)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            )}
          </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function DuelTable({ duels, decks, loading, onEdit, onDelete, maxHeight, readOnly }: Props) {
  const { t } = useTranslation();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(0);

  if (loading) {
    return (
      <div className="animate-pulse p-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 rounded" style={{ background: 'var(--color-surface-variant)' }} />
        ))}
      </div>
    );
  }

  if (duels.length === 0) {
    return (
      <div className="p-8 text-center" style={{ color: 'var(--color-on-surface-muted)' }}>
        {t('dashboard.noData')}
      </div>
    );
  }

  const totalPages = Math.ceil(duels.length / itemsPerPage);
  const paginatedDuels = duels.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);
  const startIndex = currentPage * itemsPerPage;

  return (
    <div style={maxHeight ? { maxHeight, overflowY: 'auto' } : undefined}>
      {/* Mobile Card View */}
      <MobileCardView duels={paginatedDuels} decks={decks} onEdit={onEdit} onDelete={onDelete} readOnly={readOnly} />

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="themed-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>No.</th>
              <th>{t('duel.deck')}</th>
              <th>{t('duel.opponentDeck')}</th>
              <th>{t('duel.result')}</th>
              <th>{t('duel.coinToss')}</th>
              <th>{t('duel.firstSecond')}</th>
              <th>{t('duel.rankRate')}</th>
              <th>{t('duel.memo')}</th>
              <th>{t('duel.date')}</th>
              {!readOnly && <th className="text-center">{t('common.actions')}</th>}
            </tr>
          </thead>
          <tbody>
            {paginatedDuels.map((duel, index) => (
              <tr key={duel.id}>
                <td className="text-center" style={{ color: 'var(--color-on-surface-muted)' }}>
                  {startIndex + index + 1}
                </td>
                <td>
                  <span className="chip chip-outlined-primary">{getDeckName(decks, duel.deckId)}</span>
                </td>
                <td>
                  <span className="chip chip-outlined-warning">{getDeckName(decks, duel.opponentDeckId)}</span>
                </td>
                <td>
                  <span className={`chip ${duel.result === 'win' ? 'chip-success' : 'chip-error'}`}>
                    {duel.result === 'win' ? t('duel.win') : t('duel.loss')}
                  </span>
                </td>
                <td>
                  <span className={`chip ${duel.wonCoinToss ? 'chip-coin-win' : 'chip-coin-loss'}`}>
                    {duel.wonCoinToss ? t('duel.coinTossWin') : t('duel.coinTossLoss')}
                  </span>
                </td>
                <td>
                  <span className={`chip ${duel.isFirst ? 'chip-outlined-info' : 'chip-outlined-secondary'}`}>
                    {duel.isFirst ? t('duel.first') : t('duel.second')}
                  </span>
                </td>
                <td>
                  {getRankDisplay(duel, t) ? (
                    <span className="chip chip-rank">{getRankDisplay(duel, t)}</span>
                  ) : (
                    <span style={{ color: 'var(--color-on-surface-muted)' }}>-</span>
                  )}
                </td>
                <td className="max-w-[120px] truncate" title={duel.memo ?? ''}>
                  {duel.memo ? (
                    <span className="text-xs" style={{ color: 'var(--color-on-surface-muted)' }}>{duel.memo}</span>
                  ) : null}
                </td>
                <td className="whitespace-nowrap">{formatDate(duel.dueledAt)}</td>
                {!readOnly && (
                <td className="text-center whitespace-nowrap">
                  <button
                    type="button"
                    className="themed-btn themed-btn-ghost p-1"
                    onClick={() => onEdit?.(duel)}
                    title={t('common.edit')}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  {confirmDeleteId === duel.id ? (
                    <>
                      <button
                        type="button"
                        className="themed-btn themed-btn-ghost p-1"
                        style={{ color: 'var(--color-error)' }}
                        onClick={() => { onDelete?.(duel.id); setConfirmDeleteId(null); }}
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
                      onClick={() => setConfirmDeleteId(duel.id)}
                      title={t('common.delete')}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  )}
                </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {duels.length > DEFAULT_ITEMS_PER_PAGE && (
        <div className="flex items-center justify-end gap-4 p-3" style={{ borderTop: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-on-surface-muted)' }}>
            <span>Items per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(0); }}
              className="themed-select"
              style={{ width: 'auto', padding: '4px 28px 4px 8px', fontSize: '0.75rem', backgroundPosition: 'right 6px center' }}
            >
              {ITEMS_PER_PAGE_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <span className="text-xs" style={{ color: 'var(--color-on-surface-muted)' }}>
            {startIndex + 1}-{Math.min(startIndex + itemsPerPage, duels.length)} of {duels.length}
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              className="themed-btn themed-btn-ghost p-1"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              className="themed-btn themed-btn-ghost p-1"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
