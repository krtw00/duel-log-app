import type { DeckWinRate } from '@duel-log/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

type Props = {
  winRates: DeckWinRate[];
  loading: boolean;
};

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50] as const;

function formatWinRate(wins: number, total: number, winRate: number): string {
  return `${wins} / ${total} (${(winRate * 100).toFixed(1)}%)`;
}

function getWinRateChipClass(winRate: number): string {
  if (winRate >= 0.55) return 'chip chip-outlined-info';
  if (winRate <= 0.45) return 'chip chip-error';
  return 'chip';
}

function MobileAccordion({ winRates }: { winRates: DeckWinRate[] }) {
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="sm:hidden space-y-2">
      {winRates.map((rate) => (
        <div key={rate.deckId} className="expansion-panel">
          <button
            type="button"
            className="expansion-header w-full"
            onClick={() => setExpandedId(expandedId === rate.deckId ? null : rate.deckId)}
          >
            <span
              className="flex-1 text-left text-sm font-medium"
              style={{ color: 'var(--color-on-surface)' }}
            >
              {rate.deckName}
            </span>
            <span className={getWinRateChipClass(rate.winRate)}>
              {formatWinRate(rate.wins, rate.totalDuels, rate.winRate)}
            </span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{
                transform: expandedId === rate.deckId ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s',
              }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {expandedId === rate.deckId && (
            <div className="expansion-content">
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div>
                  <div className="text-sm" style={{ color: 'var(--color-on-surface-muted)' }}>
                    {t('statistics.wins')}
                  </div>
                  <div style={{ color: 'var(--color-success)' }}>{rate.wins}</div>
                </div>
                <div>
                  <div className="text-sm" style={{ color: 'var(--color-on-surface-muted)' }}>
                    {t('statistics.losses')}
                  </div>
                  <div style={{ color: 'var(--color-error)' }}>{rate.losses}</div>
                </div>
                <div>
                  <div className="text-sm" style={{ color: 'var(--color-on-surface-muted)' }}>
                    {t('statistics.total')}
                  </div>
                  <div>{rate.totalDuels}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function WinRateTable({ winRates, loading }: Props) {
  const { t } = useTranslation();
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(0);

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-10 rounded"
            style={{ background: 'var(--color-surface-variant)' }}
          />
        ))}
      </div>
    );
  }

  if (winRates.length === 0) {
    return (
      <div className="py-8 text-center text-sm" style={{ color: 'var(--color-on-surface-muted)' }}>
        {t('statistics.noData')}
      </div>
    );
  }

  const totalPages = Math.ceil(winRates.length / itemsPerPage);
  const paginatedRates = winRates.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage,
  );
  const startIndex = currentPage * itemsPerPage;

  return (
    <>
      {/* Mobile Accordion */}
      <MobileAccordion winRates={paginatedRates} />

      {/* Desktop Table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="themed-table">
          <thead>
            <tr>
              <th>{t('duel.deck')}</th>
              <th className="text-center">{t('statistics.total')}</th>
              <th className="text-center">{t('dashboard.winRate')}</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRates.map((rate) => (
              <tr key={rate.deckId}>
                <td className="font-medium" style={{ color: 'var(--color-on-surface)' }}>
                  {rate.deckName}
                </td>
                <td className="text-center" style={{ color: 'var(--color-on-surface-muted)' }}>
                  {rate.totalDuels}
                </td>
                <td className="text-center">
                  <span className={getWinRateChipClass(rate.winRate)}>
                    {formatWinRate(rate.wins, rate.totalDuels, rate.winRate)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {winRates.length > 10 && (
        <div
          className="flex items-center justify-end gap-4 p-3"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          <div
            className="flex items-center gap-2 text-sm"
            style={{ color: 'var(--color-on-surface-muted)' }}
          >
            <span>Items per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(0);
              }}
              className="themed-select"
              style={{
                width: 'auto',
                padding: '4px 28px 4px 8px',
                fontSize: '0.75rem',
                backgroundPosition: 'right 6px center',
              }}
            >
              {ITEMS_PER_PAGE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <span className="text-sm" style={{ color: 'var(--color-on-surface-muted)' }}>
            {startIndex + 1}-{Math.min(startIndex + itemsPerPage, winRates.length)} of{' '}
            {winRates.length}
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              className="themed-btn themed-btn-ghost p-1"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              className="themed-btn themed-btn-ghost p-1"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
