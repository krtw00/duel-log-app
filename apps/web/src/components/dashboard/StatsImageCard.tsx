import type { DeckWinRate, GameMode, OverviewStats, Streaks } from '@duel-log/shared';
import { type Ref, forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { getRankLabel } from '../../utils/ranks.js';

export type ImageVisibility = {
  detailedRates: boolean;
  mistakeStats: boolean;
  rankRate: boolean;
  deckWinRates: boolean;
  streakBadge: boolean;
};

export const DEFAULT_VISIBILITY: ImageVisibility = {
  detailedRates: true,
  mistakeStats: true,
  rankRate: true,
  deckWinRates: true,
  streakBadge: true,
};

type Props = {
  stats: OverviewStats;
  streaks?: Streaks;
  gameMode: GameMode;
  deckWinRates?: DeckWinRate[];
  rank?: number | null;
  rateValue?: number | null;
  visibility?: ImageVisibility;
};

const C = {
  bg: '#0a0e27',
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

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function clampPercent(value: number): string {
  return `${Math.max(0, Math.min(100, value * 100))}%`;
}

function StatBox({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div
      style={{
        background: C.glass,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        padding: '16px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color ?? C.text }}>{value}</div>
    </div>
  );
}

export const StatsImageCard = forwardRef(function StatsImageCard(
  props: Props,
  ref: Ref<HTMLDivElement>,
) {
  const { stats, streaks, gameMode, deckWinRates, rank, rateValue, visibility } = props;
  const { t } = useTranslation();

  const resolvedVisibility = { ...DEFAULT_VISIBILITY, ...visibility };
  const hasMistakeStats = stats.playMistakes > 0;
  const showDetailedRates = resolvedVisibility.detailedRates;
  const showMistakeStats = resolvedVisibility.mistakeStats && hasMistakeStats;
  const showRankRate = resolvedVisibility.rankRate && (rank != null || rateValue != null);
  const showDeckWinRates = resolvedVisibility.deckWinRates;
  const showStreakBadge =
    resolvedVisibility.streakBadge &&
    streaks != null &&
    streaks.currentStreak >= 2 &&
    streaks.currentStreakType != null;
  const topDecks = deckWinRates?.slice(0, 5) ?? [];

  const rankRateCard = showRankRate ? (
    <div
      style={{
        background: C.glass,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'center',
        gap: 28,
      }}
    >
      {rank != null && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 4 }}>Rank</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.primary }}>
            {getRankLabel(rank, t)}
          </div>
        </div>
      )}
      {rateValue != null && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 4 }}>Rate</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: C.secondary }}>{rateValue}</div>
        </div>
      )}
    </div>
  ) : null;

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
        padding: 40,
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 28,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg viewBox="0 0 64 64" width="38" height="38" xmlns="http://www.w3.org/2000/svg">
            <rect x="5" y="5" width="54" height="54" rx="16" fill="#243041" />
            <rect x="5" y="5" width="54" height="54" rx="16" fill="none" stroke="#4b5a70" />
            <g
              fontFamily="'Liberation Serif', 'Times New Roman', serif"
              fontSize="43"
              fontWeight="700"
            >
              <text x="11.828" y="41.831" fill="#e8edf4">
                D
              </text>
              <text x="24.528" y="50.331" fill="#f8fbff">
                L
              </text>
            </g>
          </svg>
          <span
            style={{
              fontSize: 24,
              fontWeight: 700,
              fontStyle: 'italic',
              fontFamily: "'Liberation Serif', 'Times New Roman', serif",
              letterSpacing: '0.18em',
              textTransform: 'uppercase' as const,
              color: C.text,
            }}
          >
            Duel Log
          </span>
          <span style={{ fontSize: 16, color: C.textSecondary, marginLeft: 4 }}>
            {GAME_MODE_LABELS[gameMode] ?? gameMode}
          </span>
        </div>
        {showStreakBadge && (
          <div
            style={{
              background: streaks?.currentStreakType === 'win' ? C.success : C.error,
              color: C.bg,
              borderRadius: 20,
              padding: '6px 16px',
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {streaks?.currentStreakType === 'win' ? '🔥' : '💀'} {streaks?.currentStreak}{' '}
            {streaks?.currentStreakType === 'win' ? t('streak.winStreak') : t('streak.lossStreak')}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: showDeckWinRates ? 24 : 0, flex: 1, minHeight: 0 }}>
        <div
          style={{
            flex: showDeckWinRates ? '0 0 55%' : '1 1 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div
            style={{
              background: C.glass,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              padding: showDetailedRates ? '24px 28px' : '32px 36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 32,
              minHeight: showDetailedRates ? 0 : 220,
              flex: showDetailedRates || showMistakeStats ? undefined : 1,
            }}
          >
            <div>
              <div style={{ fontSize: 14, color: C.textSecondary, marginBottom: 6 }}>
                {t('dashboard.winRate')}
              </div>
              <div
                style={{
                  fontSize: showDetailedRates ? 60 : 72,
                  fontWeight: 800,
                  color: C.primary,
                  lineHeight: 1,
                }}
              >
                {pct(stats.winRate)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: showDetailedRates ? 24 : 32 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: C.textSecondary }}>
                  {t('dashboard.totalDuels')}
                </div>
                <div style={{ fontSize: showDetailedRates ? 30 : 34, fontWeight: 700 }}>
                  {stats.totalDuels}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: C.success }}>WIN</div>
                <div
                  style={{
                    fontSize: showDetailedRates ? 30 : 34,
                    fontWeight: 700,
                    color: C.success,
                  }}
                >
                  {stats.wins}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: C.error }}>LOSE</div>
                <div
                  style={{
                    fontSize: showDetailedRates ? 30 : 34,
                    fontWeight: 700,
                    color: C.error,
                  }}
                >
                  {stats.losses}
                </div>
              </div>
            </div>
          </div>

          {!showDeckWinRates && rankRateCard}

          {showDetailedRates && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
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
          )}

          {showMistakeStats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
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

        {showDeckWinRates && (
          <div
            style={{
              flex: '0 0 calc(45% - 24px)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {rankRateCard}

            <div
              style={{
                background: C.glass,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                padding: '16px 18px',
                flex: 1,
                overflow: 'hidden',
              }}
            >
              <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 10 }}>
                Deck Win Rates
              </div>
              {topDecks.length === 0 ? (
                <div style={{ color: C.textSecondary, fontSize: 13 }}>-</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {topDecks.map((deck) => (
                    <div
                      key={deck.deckId}
                      style={{
                        position: 'relative',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 12px',
                        background: C.surfaceVariant,
                        borderRadius: 6,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          height: '100%',
                          width: clampPercent(deck.winRate),
                          background: deck.winRate >= 0.5 ? `${C.success}20` : `${C.error}20`,
                          borderRadius: 6,
                        }}
                      />
                      <span
                        style={{
                          position: 'relative',
                          fontSize: 13,
                          fontWeight: 600,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: '1 1 auto',
                          minWidth: 0,
                        }}
                      >
                        {deck.deckName}
                      </span>
                      <div
                        style={{
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          flexShrink: 0,
                          marginLeft: 8,
                        }}
                      >
                        <span style={{ fontSize: 11, color: C.textSecondary }}>
                          {deck.wins}W {deck.losses}L
                        </span>
                        <span
                          style={{
                            fontSize: 15,
                            fontWeight: 700,
                            color: deck.winRate >= 0.5 ? C.success : C.error,
                          }}
                        >
                          {pct(deck.winRate)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: 20,
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <svg viewBox="0 0 64 64" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
          <rect x="5" y="5" width="54" height="54" rx="16" fill="#243041" />
          <rect x="5" y="5" width="54" height="54" rx="16" fill="none" stroke="#4b5a70" />
          <g
            fontFamily="'Liberation Serif', 'Times New Roman', serif"
            fontSize="43"
            fontWeight="700"
          >
            <text x="11.828" y="41.831" fill="#e8edf4">
              D
            </text>
            <text x="24.528" y="50.331" fill="#f8fbff">
              L
            </text>
          </g>
        </svg>
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            fontStyle: 'italic',
            fontFamily: "'Liberation Serif', 'Times New Roman', serif",
            letterSpacing: '0.18em',
            textTransform: 'uppercase' as const,
            opacity: 0.6,
            color: C.text,
          }}
        >
          Duel Log
        </span>
      </div>
    </div>
  );
});
