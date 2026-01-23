import type { GameMode, ValueSequenceEntry } from '@duel-log/shared';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type Props = {
  data: ValueSequenceEntry[];
  gameMode: GameMode;
  loading: boolean;
};

const MODE_LABELS: Record<string, string> = {
  RANK: 'ランク',
  RATE: 'レート',
  DC: 'DC値',
};

export function ValueSequenceChart({ data, gameMode, loading }: Props) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="animate-pulse h-64 bg-gray-100 rounded" />
      </div>
    );
  }

  const validData = data.filter((d) => d.value !== null);

  if (validData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
        データがありません
      </div>
    );
  }

  const chartData = validData.map((d) => ({
    date: new Date(d.dueledAt).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }),
    value: d.value,
  }));

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-2">
        {MODE_LABELS[gameMode] ?? gameMode}推移
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 3 }}
            name={MODE_LABELS[gameMode] ?? gameMode}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
