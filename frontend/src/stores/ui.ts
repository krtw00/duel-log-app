import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { GameMode } from '@/types';

const LAST_GAME_MODE_STORAGE_KEY = 'duellog.lastGameMode';
const DEFAULT_GAME_MODE: GameMode = 'RANK';

const isGameMode = (value: unknown): value is GameMode =>
  value === 'RANK' || value === 'RATE' || value === 'EVENT' || value === 'DC';

const readStoredGameMode = (): GameMode => {
  if (typeof window === 'undefined') {
    return DEFAULT_GAME_MODE;
  }

  try {
    const stored = window.localStorage.getItem(LAST_GAME_MODE_STORAGE_KEY);
    return isGameMode(stored) ? stored : DEFAULT_GAME_MODE;
  } catch {
    return DEFAULT_GAME_MODE;
  }
};

const writeStoredGameMode = (value: GameMode) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(LAST_GAME_MODE_STORAGE_KEY, value);
  } catch {
    // Ignore storage errors (private mode etc.)
  }
};

export const useUiStore = defineStore('ui', () => {
  const lastGameMode = ref<GameMode>(readStoredGameMode());

  const setLastGameMode = (mode: GameMode) => {
    lastGameMode.value = mode;
    writeStoredGameMode(mode);
  };

  return {
    lastGameMode,
    setLastGameMode,
  };
});

