/**
 * Game Modes Composable
 * Provides internationalized game mode labels and utilities
 */

import { computed } from 'vue';
import { useLocale } from './useLocale';
import type { GameMode } from '../types';

// Game mode configuration without labels (labels come from i18n)
interface GameModeConfig {
  value: GameMode;
  icon: string;
  color: string;
  hasValueField: boolean;
}

// Static configuration for game modes (non-translatable properties)
const GAME_MODE_CONFIG: Record<GameMode, GameModeConfig> = {
  RANK: {
    value: 'RANK',
    icon: 'mdi-crown',
    color: 'primary',
    hasValueField: true,
  },
  RATE: {
    value: 'RATE',
    icon: 'mdi-chart-line',
    color: 'info',
    hasValueField: true,
  },
  EVENT: {
    value: 'EVENT',
    icon: 'mdi-calendar-star',
    color: 'secondary',
    hasValueField: false,
  },
  DC: {
    value: 'DC',
    icon: 'mdi-trophy-variant',
    color: 'warning',
    hasValueField: true,
  },
};

// Game modes list (order guaranteed)
const GAME_MODES_LIST: GameMode[] = ['RANK', 'RATE', 'EVENT', 'DC'];

// Game modes with value field
const VALUE_GAME_MODES: GameMode[] = GAME_MODES_LIST.filter(
  (mode) => GAME_MODE_CONFIG[mode].hasValueField,
);

export function useGameModes() {
  const { LL } = useLocale();

  // Get translated label for a game mode
  const getGameModeLabel = (mode: GameMode): string => {
    const labels: Record<GameMode, () => string | undefined> = {
      RANK: () => LL.value?.duels.gameMode.rank(),
      RATE: () => LL.value?.duels.gameMode.rate(),
      EVENT: () => LL.value?.duels.gameMode.event(),
      DC: () => LL.value?.duels.gameMode.dc(),
    };
    return labels[mode]?.() ?? mode;
  };

  // Get translated value label for game modes with value fields
  const getGameModeValueLabel = (mode: GameMode): string => {
    // Value labels are the same as mode labels for RANK, RATE, DC
    return getGameModeLabel(mode);
  };

  // Get icon for a game mode
  const getGameModeIcon = (mode: GameMode): string => {
    return GAME_MODE_CONFIG[mode]?.icon ?? 'mdi-help';
  };

  // Get color for a game mode
  const getGameModeColor = (mode: GameMode): string => {
    return GAME_MODE_CONFIG[mode]?.color ?? 'grey';
  };

  // Check if game mode has a value field
  const gameModeHasValueField = (mode: GameMode): boolean => {
    return GAME_MODE_CONFIG[mode]?.hasValueField ?? false;
  };

  // Computed select options array (for v-select items)
  const GAME_MODE_OPTIONS = computed(() =>
    GAME_MODES_LIST.map((mode) => ({
      title: getGameModeLabel(mode),
      value: mode,
    })),
  );

  // Check if value is a valid game mode
  const isValidGameMode = (value: unknown): value is GameMode => {
    return typeof value === 'string' && GAME_MODES_LIST.includes(value as GameMode);
  };

  return {
    GAME_MODES_LIST,
    VALUE_GAME_MODES,
    GAME_MODE_OPTIONS,
    getGameModeLabel,
    getGameModeValueLabel,
    getGameModeIcon,
    getGameModeColor,
    gameModeHasValueField,
    isValidGameMode,
  };
}
