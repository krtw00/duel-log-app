import type { GameMode, ValueSequenceEntry } from '@duel-log/shared';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
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

  const { validData, chartData, yDomain } = useMemo(() => {
    const valid = data.filter((d) => d.value !== null);
    const chart = valid.map((d, i) => ({
      index: i + 1,
      date: new Date(d.dueledAt).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }),
      value: d.value,
    }));

    let domain: [number, number] | undefined;
    if (gameMode === 'RATE' && chart.length > 0) {
      const values = chart.map((d) => d.value as number);
      const min = Math.min(...values, 1500);
      const max = Math.max(...values, 1500);
      const padding = Math.max((max - min) * 0.2, 5);
      domain = [Math.floor(min - padding), Math.ceil(max + padding)];
    }

    return { validData: valid, chartData: chart, yDomain: domain };
  }, [data, gameMode]);

  if (loading) {
    return (
      <div
        className="animate-pulse h-64 rounded"
        style={{ background: 'var(--color-surface-variant)' }}
      />
    );
  }

  if (validData.length === 0) {
    return (
      <div className="py-8 text-center text-sm" style={{ color: 'var(--color-on-surface-muted)' }}>
        {t('statistics.noData')}
      </div>
    );
  }

  const modeLabel = t(`gameMode.${gameMode}`);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis
          dataKey="index"
          tick={{ fontSize: 11, fill: 'var(--color-on-surface-muted)' }}
          stroke="var(--color-border)"
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'var(--color-on-surface-muted)' }}
          stroke="var(--color-border)"
          domain={yDomain}
        />
        {gameMode === 'RATE' && (
          <ReferenceLine
            y={1500}
            stroke="var(--color-on-surface-muted)"
            strokeDasharray="4 4"
            strokeOpacity={0.6}
          />
        )}
        <Tooltip
          contentStyle={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            color: 'var(--color-on-surface)',
          }}
          labelFormatter={(_, payload) => {
            const entry = payload?.[0]?.payload;
            return entry?.date ?? '';
          }}
        />
        <Line
          type="linear"
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
