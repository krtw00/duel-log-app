import type { OverviewStats } from '@duel-log/shared';
import { useTranslation } from 'react-i18next';

type Props = {
  stats?: OverviewStats;
  loading?: boolean;
};

type StatCardData = {
  label: string;
  value: string;
  subtitle?: string;
  color: string;
  icon: React.ReactNode;
};

export function StatsDisplayCards({ stats, loading }: Props) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="stat-card animate-pulse">
            <div className="h-4 w-16 rounded" style={{ background: 'var(--color-surface-variant)' }} />
            <div className="h-8 w-20 rounded mt-2" style={{ background: 'var(--color-surface-variant)' }} />
          </div>
        ))}
      </div>
    );
  }

  const s = stats ?? { totalDuels: 0, wins: 0, losses: 0, winRate: 0, firstRate: 0, firstWinRate: 0, secondWinRate: 0, coinTossWinRate: 0 };

  const firstCount = Math.round(s.totalDuels * s.firstRate);
  const secondCount = s.totalDuels - firstCount;
  const firstWins = Math.round(firstCount * s.firstWinRate);
  const secondWins = Math.round(secondCount * s.secondWinRate);

  const cards: StatCardData[] = [
    {
      label: t('dashboard.totalDuels'),
      value: String(s.totalDuels),
      subtitle: `${s.wins}W / ${s.losses}L`,
      color: '#00d9ff',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
          <path d="M13 19l6-6" />
          <path d="M16 16l4 4" />
          <path d="M19 21l2-2" />
        </svg>
      ),
    },
    {
      label: t('dashboard.winRate'),
      value: `${Math.round(s.winRate * 100)}%`,
      subtitle: `${s.wins}${t('statistics.wins')} / ${s.losses}${t('statistics.losses')}`,
      color: '#00e676',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 9 7 12 7s5-3 7.5-3a2.5 2.5 0 0 1 0 5H18" />
          <path d="M18 9v2a6 6 0 0 1-12 0V9" />
          <path d="M12 17v4" />
          <path d="M8 21h8" />
        </svg>
      ),
    },
    {
      label: t('dashboard.firstWinRate', '先攻勝率'),
      value: `${Math.round(s.firstWinRate * 100)}%`,
      subtitle: `${firstWins}/${firstCount}`,
      color: '#ffaa00',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      ),
    },
    {
      label: t('dashboard.secondWinRate', '後攻勝率'),
      value: `${Math.round(s.secondWinRate * 100)}%`,
      subtitle: `${secondWins}/${secondCount}`,
      color: '#b536ff',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
    },
    {
      label: t('dashboard.coinTossRate'),
      value: `${Math.round(s.coinTossWinRate * 100)}%`,
      color: '#ffd600',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
    },
    {
      label: t('dashboard.firstRate'),
      value: `${Math.round(s.firstRate * 100)}%`,
      color: '#26a69a',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 19V5" />
          <path d="M5 12l7-7 7 7" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card) => (
        <div key={card.label} className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <span style={{ color: card.color }}>{card.icon}</span>
            <span className="text-xs font-medium" style={{ color: 'var(--color-on-surface-muted)' }}>
              {card.label}
            </span>
          </div>
          <div className="text-xl font-bold" style={{ color: card.color }}>
            {card.value}
          </div>
          {card.subtitle && (
            <div className="text-xs mt-1" style={{ color: 'var(--color-on-surface-muted)' }}>
              {card.subtitle}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
