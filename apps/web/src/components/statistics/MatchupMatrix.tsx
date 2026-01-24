import type { MatchupEntry } from '@duel-log/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

type Props = {
  matchups: MatchupEntry[];
  loading: boolean;
};

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50] as const;

function formatWinRate(wins: number, total: number, winRate: number): string {
  return `${wins} / ${total} (${(winRate * 100).toFixed(1)}%)`;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function getWinRateChipClass(winRate: number): string {
  if (winRate >= 0.55) return 'chip chip-outlined-info';
  if (winRate <= 0.45) return 'chip chip-error';
  return 'chip';
}

function MobileAccordion({ matchups }: { matchups: MatchupEntry[] }) {
  const { t } = useTranslation();
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  return (
    <div className="sm:hidden space-y-2">
      {matchups.map((m) => {
        const key = `${m.deckId}:${m.opponentDeckId}`;
        return (
          <div key={key} className="expansion-panel">
            <button
              type="button"
              className="expansion-header w-full"
              onClick={() => setExpandedKey(expandedKey === key ? null : key)}
            >
              <div className="flex-1 text-left">
                <span className="text-sm font-medium" style={{ color: 'var(--color-on-surface)' }}>
                  {m.deckName}
                </span>
                <span className="text-sm mx-1" style={{ color: 'var(--color-on-surface-muted)' }}>vs</span>
                <span className="text-sm" style={{ color: 'var(--color-on-surface-muted)' }}>
                  {m.opponentDeckName}
                </span>
              </div>
              <span className={getWinRateChipClass(m.winRate)}>
                {formatWinRate(m.wins, m.wins + m.losses, m.winRate)}
              </span>
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                style={{ transform: expandedKey === key ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {expandedKey === key && (
              <div className="expansion-content">
                <div className="grid grid-cols-2 gap-2 text-center text-sm">
                  <div>
                    <div className="text-sm" style={{ color: 'var(--color-on-surface-muted)' }}>{t('statistics.firstWinRate')}</div>
                    <div className={getWinRateChipClass(m.firstWinRate)}>{formatPercent(m.firstWinRate)}</div>
                  </div>
                  <div>
                    <div className="text-sm" style={{ color: 'var(--color-on-surface-muted)' }}>{t('statistics.secondWinRate')}</div>
                    <div className={getWinRateChipClass(m.secondWinRate)}>{formatPercent(m.secondWinRate)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function MatchupMatrix({ matchups, loading }: Props) {
  const { t } = useTranslation();
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(0);

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 rounded" style={{ background: 'var(--color-surface-variant)' }} />
        ))}
      </div>
    );
  }

  if (matchups.length === 0) {
    return (
      <div className="py-8 text-center text-sm" style={{ color: 'var(--color-on-surface-muted)' }}>
        {t('statistics.noData')}
      </div>
    );
  }

  const totalPages = Math.ceil(matchups.length / itemsPerPage);
  const paginatedMatchups = matchups.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);
  const startIndex = currentPage * itemsPerPage;

  return (
    <>
      {/* Mobile Accordion */}
      <MobileAccordion matchups={paginatedMatchups} />

      {/* Desktop Table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="themed-table">
          <thead>
            <tr>
              <th>{t('duel.deck')}</th>
              <th>{t('duel.opponentDeck')}</th>
              <th className="text-center">{t('statistics.total')}</th>
              <th className="text-center">{t('dashboard.winRate')}</th>
              <th className="text-center">{t('statistics.firstWinRate')}</th>
              <th className="text-center">{t('statistics.secondWinRate')}</th>
            </tr>
          </thead>
          <tbody>
            {paginatedMatchups.map((m) => (
              <tr key={`${m.deckId}:${m.opponentDeckId}`}>
                <td className="font-medium" style={{ color: 'var(--color-on-surface)' }}>{m.deckName}</td>
                <td style={{ color: 'var(--color-on-surface-muted)' }}>{m.opponentDeckName}</td>
                <td className="text-center" style={{ color: 'var(--color-on-surface-muted)' }}>
                  {m.wins + m.losses}
                </td>
                <td className="text-center">
                  <span className={getWinRateChipClass(m.winRate)}>
                    {formatWinRate(m.wins, m.wins + m.losses, m.winRate)}
                  </span>
                </td>
                <td className="text-center">
                  <span className={getWinRateChipClass(m.firstWinRate)}>
                    {formatPercent(m.firstWinRate)}
                  </span>
                </td>
                <td className="text-center">
                  <span className={getWinRateChipClass(m.secondWinRate)}>
                    {formatPercent(m.secondWinRate)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {matchups.length > 10 && (
        <div className="flex items-center justify-end gap-4 p-3" style={{ borderTop: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-on-surface-muted)' }}>
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
          <span className="text-sm" style={{ color: 'var(--color-on-surface-muted)' }}>
            {startIndex + 1}-{Math.min(startIndex + itemsPerPage, matchups.length)} of {matchups.length}
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
    </>
  );
}
