import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import StreamerPopupView from '../StreamerPopupView.vue';
import { createRouter, createWebHistory } from 'vue-router';
import { createPinia, setActivePinia } from 'pinia';

vi.mock('@/services/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue({
      data: {
        RANK: {
          overall_stats: {
            total: 100,
            wins: 55,
            win_rate: 0.55,
            first_turn_wins: 30,
            first_turn_total: 50,
            first_turn_win_rate: 0.6,
            second_turn_wins: 25,
            second_turn_total: 50,
            second_turn_win_rate: 0.5,
            coin_wins: 48,
            coin_total: 100,
            coin_win_rate: 0.48,
            go_first_rate: 0.5,
          },
          duels: [
            {
              deck: { name: 'テストデッキ' },
              rank: 'MASTER_5',
            },
          ],
        },
      },
    }),
  },
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(() => ({
    isAuthenticated: true,
    chromaKeyBackground: null,
    fetchUser: vi.fn().mockResolvedValue(undefined),
  })),
}));

const vuetify = createVuetify({ components, directives });

describe('StreamerPopupView.vue', () => {
  let router: ReturnType<typeof createRouter>;
  let originalOpener: Window['opener'];
  let resizeToMock: ReturnType<typeof vi.fn>;

  const createRouterWithQuery = () => {
    return createRouter({
      history: createWebHistory(),
      routes: [
        {
          path: '/streamer-popup',
          name: 'streamer-popup',
          component: StreamerPopupView,
        },
      ],
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());

    // window.openerをモック（ポップアップとして開かれた状態をシミュレート）
    originalOpener = window.opener;
    Object.defineProperty(window, 'opener', {
      value: {},
      writable: true,
      configurable: true,
    });

    // window.resizeToをモック
    resizeToMock = vi.fn();
    window.resizeTo = resizeToMock;

    // window.outerWidth/innerWidthをモック
    Object.defineProperty(window, 'outerWidth', { value: 800, configurable: true });
    Object.defineProperty(window, 'innerWidth', { value: 780, configurable: true });
    Object.defineProperty(window, 'outerHeight', { value: 600, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 560, configurable: true });
  });

  afterEach(() => {
    vi.clearAllTimers();
    // window.openerを元に戻す
    Object.defineProperty(window, 'opener', {
      value: originalOpener,
      writable: true,
      configurable: true,
    });
  });

  describe('レイアウト', () => {
    it('horizontalレイアウトが正しく適用される', async () => {
      router = createRouterWithQuery();

      await router.push({
        path: '/streamer-popup',
        query: {
          layout: 'horizontal',
          items: 'win_rate,total_duels',
        },
      });
      await router.isReady();

      const wrapper = mount(StreamerPopupView, {
        global: {
          plugins: [vuetify, router],
        },
      });

      await flushPromises();
      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(wrapper.find('.stats-card').classes()).toContain('layout-horizontal');
    });

    it('verticalレイアウトが正しく適用される', async () => {
      router = createRouterWithQuery();

      await router.push({
        path: '/streamer-popup',
        query: {
          layout: 'vertical',
          items: 'win_rate,total_duels',
        },
      });
      await router.isReady();

      const wrapper = mount(StreamerPopupView, {
        global: {
          plugins: [vuetify, router],
        },
      });

      await flushPromises();
      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(wrapper.find('.stats-card').classes()).toContain('layout-vertical');
    });

    it('gridレイアウトが正しく適用される', async () => {
      router = createRouterWithQuery();

      await router.push({
        path: '/streamer-popup',
        query: {
          layout: 'grid',
          items: 'win_rate,total_duels',
        },
      });
      await router.isReady();

      const wrapper = mount(StreamerPopupView, {
        global: {
          plugins: [vuetify, router],
        },
      });

      await flushPromises();
      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(wrapper.find('.stats-card').classes()).toContain('layout-grid');
    });
  });

  describe('ウィンドウリサイズ', () => {
    it('horizontalレイアウトでは自動リサイズが実行される', async () => {
      router = createRouterWithQuery();

      await router.push({
        path: '/streamer-popup',
        query: {
          layout: 'horizontal',
          items: 'win_rate,total_duels',
        },
      });
      await router.isReady();

      mount(StreamerPopupView, {
        global: {
          plugins: [vuetify, router],
        },
      });

      await flushPromises();
      // リサイズ処理のsetTimeoutを待つ
      await new Promise((resolve) => setTimeout(resolve, 300));

      expect(resizeToMock).toHaveBeenCalled();
    });

    it('verticalレイアウトでは自動リサイズが実行される', async () => {
      router = createRouterWithQuery();

      await router.push({
        path: '/streamer-popup',
        query: {
          layout: 'vertical',
          items: 'win_rate,total_duels',
        },
      });
      await router.isReady();

      mount(StreamerPopupView, {
        global: {
          plugins: [vuetify, router],
        },
      });

      await flushPromises();
      await new Promise((resolve) => setTimeout(resolve, 300));

      expect(resizeToMock).toHaveBeenCalled();
    });

    it('gridレイアウトでは自動リサイズが実行されない', async () => {
      router = createRouterWithQuery();

      await router.push({
        path: '/streamer-popup',
        query: {
          layout: 'grid',
          items: 'win_rate,total_duels',
        },
      });
      await router.isReady();

      mount(StreamerPopupView, {
        global: {
          plugins: [vuetify, router],
        },
      });

      await flushPromises();
      await new Promise((resolve) => setTimeout(resolve, 300));

      // gridレイアウトではresizeToが呼ばれない
      expect(resizeToMock).not.toHaveBeenCalled();
    });

    it('ポップアップウィンドウでない場合は自動リサイズが実行されない', async () => {
      // window.openerをnullに設定（通常のウィンドウ）
      Object.defineProperty(window, 'opener', {
        value: null,
        writable: true,
        configurable: true,
      });

      router = createRouterWithQuery();

      await router.push({
        path: '/streamer-popup',
        query: {
          layout: 'horizontal',
          items: 'win_rate,total_duels',
        },
      });
      await router.isReady();

      mount(StreamerPopupView, {
        global: {
          plugins: [vuetify, router],
        },
      });

      await flushPromises();
      await new Promise((resolve) => setTimeout(resolve, 300));

      expect(resizeToMock).not.toHaveBeenCalled();
    });
  });

  describe('テーマ', () => {
    it('darkテーマが正しく適用される', async () => {
      router = createRouterWithQuery();

      await router.push({
        path: '/streamer-popup',
        query: {
          theme: 'dark',
          items: 'win_rate',
        },
      });
      await router.isReady();

      const wrapper = mount(StreamerPopupView, {
        global: {
          plugins: [vuetify, router],
        },
      });

      await flushPromises();

      expect(wrapper.find('.streamer-popup').classes()).toContain('theme-dark');
    });

    it('lightテーマが正しく適用される', async () => {
      router = createRouterWithQuery();

      await router.push({
        path: '/streamer-popup',
        query: {
          theme: 'light',
          items: 'win_rate',
        },
      });
      await router.isReady();

      const wrapper = mount(StreamerPopupView, {
        global: {
          plugins: [vuetify, router],
        },
      });

      await flushPromises();

      expect(wrapper.find('.streamer-popup').classes()).toContain('theme-light');
    });

    it('lightテーマでもリサイズ処理が実行される', async () => {
      router = createRouterWithQuery();

      await router.push({
        path: '/streamer-popup',
        query: {
          theme: 'light',
          layout: 'horizontal',
          items: 'win_rate,total_duels',
        },
      });
      await router.isReady();

      mount(StreamerPopupView, {
        global: {
          plugins: [vuetify, router],
        },
      });

      await flushPromises();
      await new Promise((resolve) => setTimeout(resolve, 300));

      // lightテーマでもリサイズが呼ばれる
      expect(resizeToMock).toHaveBeenCalled();
    });
  });

  describe('表示項目', () => {
    it('指定された表示項目のみ表示される', async () => {
      router = createRouterWithQuery();

      await router.push({
        path: '/streamer-popup',
        query: {
          items: 'win_rate,total_duels',
        },
      });
      await router.isReady();

      const wrapper = mount(StreamerPopupView, {
        global: {
          plugins: [vuetify, router],
        },
      });

      await flushPromises();
      await new Promise((resolve) => setTimeout(resolve, 200));

      const statItems = wrapper.findAll('.stat-item');
      expect(statItems.length).toBe(2);
    });

    it('表示項目数が変わるとリサイズが実行される', async () => {
      // 2項目
      router = createRouterWithQuery();

      await router.push({
        path: '/streamer-popup',
        query: {
          layout: 'horizontal',
          items: 'win_rate,total_duels',
        },
      });
      await router.isReady();

      mount(StreamerPopupView, {
        global: {
          plugins: [vuetify, router],
        },
      });

      await flushPromises();
      await new Promise((resolve) => setTimeout(resolve, 300));

      expect(resizeToMock).toHaveBeenCalled();
    });
  });
});
