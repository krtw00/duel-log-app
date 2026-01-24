import type { OverviewStats } from '@duel-log/shared';

type Props = {
  stats: OverviewStats | undefined;
  loading: boolean;
};

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function StatsDisplayCards({ stats, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {['s1', 's2', 's3', 's4', 's5', 's6'].map((id) => (
          <div key={id} className="bg-white rounded-lg shadow p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-16 mb-2" />
            <div className="h-8 bg-gray-200 rounded w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    { label: '総対戦数', value: stats.totalDuels.toString(), color: 'text-gray-900' },
    {
      label: '勝率',
      value: formatPercent(stats.winRate),
      color: stats.winRate >= 0.5 ? 'text-green-600' : 'text-red-600',
    },
    {
      label: '先攻勝率',
      value: formatPercent(stats.firstWinRate),
      color: stats.firstWinRate >= 0.5 ? 'text-green-600' : 'text-red-600',
    },
    {
      label: '後攻勝率',
      value: formatPercent(stats.secondWinRate),
      color: stats.secondWinRate >= 0.5 ? 'text-green-600' : 'text-red-600',
    },
    { label: '先攻率', value: formatPercent(stats.firstRate), color: 'text-blue-600' },
    {
      label: 'じゃんけん勝率',
      value: formatPercent(stats.coinTossWinRate),
      color: 'text-purple-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">{card.label}</p>
          <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
          {card.label === '勝率' && (
            <p className="text-xs text-gray-400 mt-1">
              {stats.wins}勝 {stats.losses}敗
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
