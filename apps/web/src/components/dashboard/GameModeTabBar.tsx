import { GAME_MODES, type GameMode } from '@duel-log/shared';
import { useTranslation } from 'react-i18next';

type Props = {
  value: GameMode;
  onChange: (mode: GameMode) => void;
  counts?: Record<string, number>;
};

const GAME_MODE_CHIP_COLORS: Record<GameMode, string> = {
  RANK: 'var(--color-primary)',
  RATE: '#00d9ff',
  EVENT: 'var(--color-secondary)',
  DC: 'var(--color-warning)',
};

const GAME_MODE_ICONS: Record<GameMode, React.ReactNode> = {
  RANK: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 4l3 12h14l3-12-5 4-5-6-5 6-3-4z" />
      <path d="M5 16v4h14v-4" />
    </svg>
  ),
  RATE: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  EVENT: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <path d="M12 14l-2 2 2 2" />
    </svg>
  ),
  DC: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 9 7 12 7s5-3 7.5-3a2.5 2.5 0 0 1 0 5H18" />
      <path d="M18 9v2a6 6 0 0 1-12 0V9" />
    </svg>
  ),
};

export function GameModeTabBar({ value, onChange, counts }: Props) {
  const { t } = useTranslation();

  return (
    <div className="tab-bar">
      {GAME_MODES.map((mode) => (
        <button
          key={mode}
          type="button"
          className={`tab-item ${value === mode ? 'active' : ''}`}
          onClick={() => onChange(mode)}
        >
          {GAME_MODE_ICONS[mode]}
          <span className="hidden sm:inline">{t(`gameMode.${mode}`)}</span>
          <span className="sm:hidden">{mode}</span>
          {counts?.[mode] != null && (
            <span
              className="chip text-xs"
              style={{
                backgroundColor: `color-mix(in srgb, ${GAME_MODE_CHIP_COLORS[mode]} 20%, transparent)`,
                color: GAME_MODE_CHIP_COLORS[mode],
                padding: '1px 6px',
                fontSize: '0.7rem',
              }}
            >
              {counts[mode]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
