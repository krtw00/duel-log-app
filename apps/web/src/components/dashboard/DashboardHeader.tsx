import type { GameMode } from '@duel-log/shared';
import { DateFilterBar } from './DateFilterBar.js';
import { GameModeTabBar } from './GameModeTabBar.js';

type Props = {
  gameMode: GameMode;
  onGameModeChange: (mode: GameMode) => void;
  year: number;
  month: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  modeCounts?: Record<string, number>;
};

export function DashboardHeader({
  gameMode,
  onGameModeChange,
  year,
  month,
  onYearChange,
  onMonthChange,
  modeCounts,
}: Props) {
  return (
    <div
      className="sticky top-16 z-20 -mx-4 px-4 py-3 space-y-3"
      style={{ background: 'var(--color-bg)' }}
    >
      <GameModeTabBar value={gameMode} onChange={onGameModeChange} counts={modeCounts} />
      <DateFilterBar
        year={year}
        month={month}
        onYearChange={onYearChange}
        onMonthChange={onMonthChange}
      />
    </div>
  );
}
