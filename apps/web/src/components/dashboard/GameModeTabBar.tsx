import { GAME_MODES, type GameMode } from '@duel-log/shared';

const GAME_MODE_LABELS: Record<GameMode, string> = {
  RANK: 'ランク',
  RATE: 'レート',
  EVENT: 'イベント',
  DC: 'DC',
};

type Props = {
  value: GameMode | undefined;
  onChange: (mode: GameMode | undefined) => void;
};

export function GameModeTabBar({ value, onChange }: Props) {
  return (
    <div className="flex gap-1 border-b border-gray-200">
      <button
        type="button"
        className={`px-4 py-2 text-sm font-medium transition-colors ${
          value === undefined
            ? 'border-b-2 border-blue-600 text-blue-600'
            : 'text-gray-500 hover:text-gray-700'
        }`}
        onClick={() => onChange(undefined)}
      >
        全て
      </button>
      {GAME_MODES.map((mode) => (
        <button
          key={mode}
          type="button"
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            value === mode
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => onChange(mode)}
        >
          {GAME_MODE_LABELS[mode]}
        </button>
      ))}
    </div>
  );
}
