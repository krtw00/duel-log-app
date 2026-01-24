import { create } from 'zustand';

type ThemeMode = 'dark' | 'light';

type ThemeState = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
  initialize: () => void;
};

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  if (mode === 'light') {
    root.classList.add('light');
  } else {
    root.classList.remove('light');
  }
}

const STORAGE_KEY = 'duellog.theme';

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'dark',

  setMode: (mode: ThemeMode) => {
    applyTheme(mode);
    localStorage.setItem(STORAGE_KEY, mode);
    set({ mode });
  },

  toggle: () => {
    const next = get().mode === 'dark' ? 'light' : 'dark';
    get().setMode(next);
  },

  initialize: () => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    const mode = stored === 'light' ? 'light' : 'dark';
    applyTheme(mode);
    set({ mode });
  },
}));
