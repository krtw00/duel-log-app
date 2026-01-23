import type { DeckWinRate } from '@duel-log/shared';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

type Props = {
  winRates: DeckWinRate[];
  loading: boolean;
};

const COLORS = [
  '#3b82f6',
  '#ef4444',
  '#22c55e',
  '#f59e0b',
  '#8b5cf6',
  '#06b6d4',
  '#f97316',
  '#ec4899',
  '#14b8a6',
  '#6366f1',
];

export function DeckDistributionChart({ winRates, loading }: Props) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="animate-pulse h-64 bg-gray-100 rounded" />
      </div>
    );
  }

  if (winRates.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
        データがありません
      </div>
    );
  }

  const data = winRates.map((r) => ({
    name: r.deckName,
    value: r.totalDuels,
  }));

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-2">デッキ使用分布</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`${value}戦`, '試合数']} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
