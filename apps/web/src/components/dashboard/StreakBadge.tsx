import type { Streaks } from '@duel-log/shared';

type Props = {
  streaks: Streaks | undefined;
};

export function StreakBadge({ streaks }: Props) {
  if (!streaks || streaks.currentStreak === 0 || !streaks.currentStreakType) {
    return null;
  }

  const isWin = streaks.currentStreakType === 'win';
  const bgColor = isWin ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  const label = isWin ? '連勝中' : '連敗中';

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${bgColor}`}
    >
      {streaks.currentStreak}
      {label}
    </span>
  );
}
