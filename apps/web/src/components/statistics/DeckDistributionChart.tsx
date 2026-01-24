import type { MatchupEntry } from '@duel-log/shared';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

type Props = {
  matchups: MatchupEntry[];
  loading: boolean;
};

const COLORS = [
  '#00d9ff',
  '#b536ff',
  '#ff2d95',
  '#00e676',
  '#ffaa00',
  '#06b6d4',
  '#f97316',
  '#ec4899',
  '#14b8a6',
  '#6366f1',
];

export function DeckDistributionChart({ matchups, loading }: Props) {
  const { t } = useTranslation();

  // Aggregate opponent deck distribution from matchups
  const data = useMemo(() => {
    const deckMap = new Map<string, { name: string; count: number; isGeneric: boolean }>();
    for (const m of matchups) {
      const existing = deckMap.get(m.opponentDeckId);
      if (existing) {
        existing.count += m.wins + m.losses;
      } else {
        deckMap.set(m.opponentDeckId, {
          name: m.opponentDeckName,
          count: m.wins + m.losses,
          isGeneric: m.opponentDeckIsGeneric,
        });
      }
    }
    return Array.from(deckMap.values())
      .sort((a, b) => {
        const aGen = a.isGeneric === true;
        const bGen = b.isGeneric === true;
        if (aGen !== bGen) return aGen ? 1 : -1;
        return b.count - a.count;
      })
      .map((d) => ({ name: d.name, value: d.count }));
  }, [matchups]);

  if (loading) {
    return (
      <div className="animate-pulse h-64 rounded" style={{ background: 'var(--color-surface-variant)' }} />
    );
  }

  if (data.length === 0) {
    return (
      <div className="py-8 text-center text-sm" style={{ color: 'var(--color-on-surface-muted)' }}>
        {t('statistics.noData')}
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="w-full" style={{ height: '100%', minHeight: '400px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="40%"
            cy="50%"
            outerRadius="80%"
            innerRadius="25%"
            startAngle={90}
            endAngle={-270}
            stroke="var(--color-surface)"
            strokeWidth={2}
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            wrapperStyle={{ zIndex: 1000 }}
            contentStyle={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              color: 'var(--color-on-surface)',
            }}
            itemStyle={{ color: 'var(--color-on-surface)' }}
            labelStyle={{ color: 'var(--color-on-surface)', fontWeight: 600 }}
            formatter={(value, name) => {
              const pct = total > 0 ? ((value as number) / total * 100).toFixed(1) : '0';
              return [`${pct}% (${value}${t('statistics.matches')})`, name];
            }}
          />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            wrapperStyle={{
              color: 'var(--color-on-surface-muted)',
              fontSize: '12px',
              paddingLeft: '16px',
              maxHeight: '90%',
              overflowY: 'auto',
            }}
            payload={data.map((d, i) => ({
              value: d.name,
              type: 'circle' as const,
              color: COLORS[i % COLORS.length],
            }))}
            formatter={(value) => {
              const entry = data.find((d) => d.name === value);
              const pct = entry && total > 0 ? ((entry.value / total) * 100).toFixed(0) : '0';
              return `${value} (${pct}%)`;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
