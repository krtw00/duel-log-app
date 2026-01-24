import type { Streaks } from '@duel-log/shared';
import { useTranslation } from 'react-i18next';

type Props = {
  streaks: Streaks | undefined;
};

export function StreakBadge({ streaks }: Props) {
  const { t } = useTranslation();

  if (!streaks || streaks.currentStreak < 2 || !streaks.currentStreakType) {
    return null;
  }

  const isWin = streaks.currentStreakType === 'win';

  return (
    <span className={`chip ${isWin ? 'chip-success' : 'chip-error'}`}>
      {isWin ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14 0-5.5 3.5-7.5-2 2 .5 3.5 2 5 1.5 1.5 2 3.5 2 5.5a4 4 0 0 1-7.5 2.5" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2 12h2a8 8 0 0 1 8 8v0a8 8 0 0 0 8-8h2" />
          <path d="M6 8l-2 2 2 2" />
          <circle cx="12" cy="8" r="2" />
          <path d="M18 8l2-2-2-2" />
        </svg>
      )}
      {t(isWin ? 'streak.winStreak' : 'streak.lossStreak', { count: streaks.currentStreak })}
    </span>
  );
}
