import type { DeckWinRate, GameMode, OverviewStats, Streaks } from '@duel-log/shared';
import { type Ref, forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

type Props = {
  stats: OverviewStats;
  streaks?: Streaks;
  gameMode: GameMode;
  deckWinRates?: DeckWinRate[];
  rank?: number | null;
  rateValue?: number | null;
};

const C = {
  bg: '#0a0e27',
  surface: '#12162e',
  surfaceVariant: '#1a1f3a',
  primary: '#00d9ff',
  secondary: '#b536ff',
  accent: '#ff2d95',
  success: '#00e676',
  error: '#ff3d71',
  text: '#e0e0e0',
  textSecondary: '#94a3b8',
  border: 'rgba(255,255,255,0.08)',
  glass: 'rgba(18,22,46,0.85)',
} as const;

const GAME_MODE_LABELS: Record<string, string> = {
  RANK: 'Ranked',
  CASUAL: 'Casual',
  RATE: 'Rating',
  EVENT: 'Event',
  DC: 'Duel Cup',
};

function pct(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

function StatBox({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div
      style={{
        background: C.glass,
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        padding: '8px 12px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 11, color: C.textSecondary, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: color ?? C.text }}>{value}</div>
    </div>
  );
}

export const StatsImageCard = forwardRef(function StatsImageCard(
  props: Props,
  ref: Ref<HTMLDivElement>,
) {
  const { stats, streaks, gameMode, deckWinRates, rank, rateValue } = props;
  const { t } = useTranslation();

  const topDecks = deckWinRates?.slice(0, 5) ?? [];

  return (
    <div
      ref={ref}
      style={{
        width: 1200,
        height: 675,
        background: `linear-gradient(135deg, ${C.bg} 0%, #0f1535 100%)`,
        color: C.text,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        padding: 32,
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span
            style={{
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: 2,
              background: `linear-gradient(90deg, ${C.primary}, ${C.secondary})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            DUEL LOG
          </span>
          <span style={{ fontSize: 16, color: C.textSecondary }}>
            {GAME_MODE_LABELS[gameMode] ?? gameMode}
          </span>
        </div>
        {streaks && streaks.currentStreak >= 2 && streaks.currentStreakType && (
          <div
            style={{
              background: streaks.currentStreakType === 'win' ? C.success : C.error,
              color: C.bg,
              borderRadius: 20,
              padding: '6px 16px',
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {streaks.currentStreakType === 'win' ? '🔥' : '💀'} {streaks.currentStreak}{' '}
            {streaks.currentStreakType === 'win' ? t('streak.winStreak') : t('streak.lossStreak')}
          </div>
        )}
      </div>

      {/* Main */}
      <div style={{ display: 'flex', gap: 24, flex: 1, minHeight: 0 }}>
        {/* Left Column (60%) */}
        <div style={{ flex: '0 0 60%', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Big win rate */}
          <div
            style={{
              background: C.glass,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: 32,
            }}
          >
            <div>
              <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 4 }}>
                {t('dashboard.winRate')}
              </div>
              <div
                style={{
                  fontSize: 56,
                  fontWeight: 800,
                  color: C.primary,
                  lineHeight: 1,
                }}
              >
                {pct(stats.winRate)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 24 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: C.textSecondary }}>
                  {t('dashboard.totalDuels')}
                </div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.totalDuels}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: C.success }}>WIN</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: C.success }}>{stats.wins}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: C.error }}>LOSE</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: C.error }}>{stats.losses}</div>
              </div>
            </div>
          </div>

          {/* Sub stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            <StatBox label={t('dashboard.firstRate')} value={pct(stats.firstRate)} />
            <StatBox
              label={t('dashboard.firstWinRate')}
              value={pct(stats.firstWinRate)}
              color={C.primary}
            />
            <StatBox
              label={t('dashboard.secondWinRate')}
              value={pct(stats.secondWinRate)}
              color={C.secondary}
            />
            <StatBox label={t('dashboard.coinTossRate')} value={pct(stats.coinTossWinRate)} />
          </div>

          {/* Play mistake stats */}
          {stats.playMistakes > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              <StatBox
                label={t('dashboard.playMistakeRate')}
                value={pct(stats.playMistakeRate)}
                color={C.error}
              />
              <StatBox
                label={t('dashboard.playMistakeWinRate')}
                value={pct(stats.playMistakeWinRate)}
                color={C.accent}
              />
            </div>
          )}
        </div>

        {/* Right Column (40%) */}
        <div
          style={{
            flex: '0 0 calc(40% - 24px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {/* Rank / Rate */}
          {(rank != null || rateValue != null) && (
            <div
              style={{
                background: C.glass,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                padding: '12px 16px',
                display: 'flex',
                justifyContent: 'center',
                gap: 24,
              }}
            >
              {rank != null && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: C.textSecondary }}>Rank</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: C.primary }}>{rank}</div>
                </div>
              )}
              {rateValue != null && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: C.textSecondary }}>Rate</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: C.secondary }}>
                    {rateValue}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Deck Win Rates */}
          <div
            style={{
              background: C.glass,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: '12px 16px',
              flex: 1,
              overflow: 'hidden',
            }}
          >
            <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 8 }}>
              Deck Win Rates
            </div>
            {topDecks.length === 0 ? (
              <div style={{ color: C.textSecondary, fontSize: 13 }}>—</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {topDecks.map((d) => (
                  <div
                    key={d.deckId}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '6px 8px',
                      background: C.surfaceVariant,
                      borderRadius: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '60%',
                      }}
                    >
                      {d.deckName}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, color: C.textSecondary }}>
                        {d.wins}W {d.losses}L
                      </span>
                      <span
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: d.winRate >= 0.5 ? C.success : C.error,
                        }}
                      >
                        {pct(d.winRate)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: 16,
          textAlign: 'right',
          fontSize: 12,
          color: C.textSecondary,
          letterSpacing: 1,
        }}
      >
        duel-log-app.vercel.app
      </div>
    </div>
  );
});
