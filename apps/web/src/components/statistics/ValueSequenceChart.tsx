import type { GameMode, ValueSequenceEntry } from '@duel-log/shared';
import { useTranslation } from 'react-i18next';
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

export function ValueSequenceChart({ data, gameMode, loading }: Props) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="animate-pulse h-64 rounded" style={{ background: 'var(--color-surface-variant)' }} />
    );
  }

  const validData = data.filter((d) => d.value !== null);

  if (validData.length === 0) {
    return (
      <div className="py-8 text-center text-sm" style={{ color: 'var(--color-on-surface-muted)' }}>
        {t('statistics.noData')}
      </div>
    );
  }

  const chartData = validData.map((d) => ({
    date: new Date(d.dueledAt).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }),
    value: d.value,
  }));

  const modeLabel = t(`gameMode.${gameMode}`);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: 'var(--color-on-surface-muted)' }}
          stroke="var(--color-border)"
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'var(--color-on-surface-muted)' }}
          stroke="var(--color-border)"
        />
        <Tooltip
          contentStyle={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            color: 'var(--color-on-surface)',
          }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="var(--color-primary)"
          strokeWidth={2}
          dot={{ r: 3, fill: 'var(--color-primary)' }}
          activeDot={{ r: 5, fill: 'var(--color-primary)' }}
          name={modeLabel}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
