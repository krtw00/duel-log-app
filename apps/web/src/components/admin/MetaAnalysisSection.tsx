import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api.js';

type PopularDeck = {
  deckName: string;
  userCount: number;
  duelCount: number;
  winRate: number;
};

type GameModeStat = {
  gameMode: string;
  duelCount: number;
  percentage: number;
};

export function MetaAnalysisSection() {
  const { t } = useTranslation();

  const { data: popularDecks, isLoading: decksLoading } = useQuery({
    queryKey: ['admin', 'meta', 'popular-decks'],
    queryFn: () => api<{ data: PopularDeck[] }>('/admin/meta/popular-decks'),
  });

  const { data: gameModeStats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'meta', 'game-mode-stats'],
    queryFn: () => api<{ data: GameModeStat[] }>('/admin/meta/game-mode-stats'),
  });

  return (
    <section className="glass-card overflow-hidden">
      <div className="p-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-on-surface)' }}>
          {t('admin.metaAnalysis')}
        </h2>
      </div>

      <div className="p-4 space-y-6">
        {/* Popular Decks */}
        <div>
          <h3
            className="text-sm font-medium mb-2"
            style={{ color: 'var(--color-on-surface-muted)' }}
          >
            {t('admin.popularDecks')}
          </h3>
          {decksLoading ? (
            <div className="animate-pulse space-y-2">
              {['s1', 's2', 's3'].map((id) => (
                <div
                  key={id}
                  className="h-8 rounded"
                  style={{ background: 'var(--color-surface-variant)' }}
                />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="themed-table">
                <thead>
                  <tr>
                    <th>{t('duel.deck')}</th>
                    <th className="text-center">{t('admin.totalUsers')}</th>
                    <th className="text-center">{t('admin.totalDuels')}</th>
                    <th className="text-center">{t('dashboard.winRate')}</th>
                  </tr>
                </thead>
                <tbody>
                  {(popularDecks?.data ?? []).map((deck) => (
                    <tr key={deck.deckName}>
                      <td className="font-medium" style={{ color: 'var(--color-on-surface)' }}>
                        {deck.deckName}
                      </td>
                      <td
                        className="text-center"
                        style={{ color: 'var(--color-on-surface-muted)' }}
                      >
                        {deck.userCount}
                      </td>
                      <td
                        className="text-center"
                        style={{ color: 'var(--color-on-surface-muted)' }}
                      >
                        {deck.duelCount}
                      </td>
                      <td className="text-center">
                        <span
                          className={`chip ${deck.winRate >= 0.55 ? 'chip-outlined-info' : deck.winRate <= 0.45 ? 'chip-error' : ''}`}
                        >
                          {(deck.winRate * 100).toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Game Mode Stats */}
        <div>
          <h3
            className="text-sm font-medium mb-2"
            style={{ color: 'var(--color-on-surface-muted)' }}
          >
            {t('admin.gameModeStats')}
          </h3>
          {statsLoading ? (
            <div className="animate-pulse space-y-2">
              {['s1', 's2'].map((id) => (
                <div
                  key={id}
                  className="h-8 rounded"
                  style={{ background: 'var(--color-surface-variant)' }}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(gameModeStats?.data ?? []).map((stat) => (
                <div
                  key={stat.gameMode}
                  className="text-center p-3 rounded"
                  style={{ background: 'var(--color-surface-variant)' }}
                >
                  <div className="text-sm mb-1" style={{ color: 'var(--color-on-surface-muted)' }}>
                    {stat.gameMode}
                  </div>
                  <div className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>
                    {stat.duelCount.toLocaleString()}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--color-on-surface-muted)' }}>
                    {(stat.percentage * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
