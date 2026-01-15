/// <reference types="vitest/globals" />
import { vi } from 'vitest';
import { config } from '@vue/test-utils';

// i18nの初期化（日本語をデフォルトに）
import { setLocale } from './src/i18n';
await setLocale('ja');

// ResizeObserverのモック
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// visualViewportのモック
global.visualViewport = {
  width: 1920,
  height: 1080,
  scale: 1,
  offsetTop: 0,
  offsetLeft: 0,
  onresize: vi.fn(),
  onscroll: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
} as any;

// matchMediaのモック
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Vuetifyのグローバルプロパティのモック
config.global.mocks = {
  $vuetify: {
    display: {
      xs: false,
      sm: false,
      md: true,
      lg: true,
      xl: false,
      smAndUp: true,
      smAndDown: false,
      mdAndUp: true,
    },
    theme: {
      current: {
        dark: true,
      },
    },
  },
};
