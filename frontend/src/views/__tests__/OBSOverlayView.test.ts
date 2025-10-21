import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import OBSOverlayView from '../OBSOverlayView.vue';
import axios from 'axios';
import { createRouter, createWebHistory } from 'vue-router';

vi.mock('axios');

const vuetify = createVuetify({ components, directives });

describe('OBSOverlayView.vue', () => {
  let router: any;

  const createRouterWithQuery = () => {
    return createRouter({
      history: createWebHistory(),
      routes: [
        {
          path: '/obs-overlay',
          name: 'obs-overlay',
          component: OBSOverlayView,
        },
      ],
    });
  };

  beforeEach(async () => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('正しくレンダリングされ、トークンがある場合に統計情報を取得する', async () => {
    const mockStats = {
      current_deck: 'ライゼル',
      current_rank: 'MASTER_5',
      total_duels: 100,
      win_rate: 0.55,
      first_turn_win_rate: 0.52,
      second_turn_win_rate: 0.58,
      coin_win_rate: 0.5,
      go_first_rate: 0.48,
    };

    vi.mocked(axios.get).mockResolvedValue({ data: mockStats });

    router = createRouterWithQuery();

    await router.push({
      path: '/obs-overlay',
      query: {
        token: 'test-token-123',
        period_type: 'recent',
        limit: '30',
        layout: 'grid',
      },
    });

    const wrapper = mount(OBSOverlayView, {
      global: {
        plugins: [vuetify, router],
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('/statistics/obs'),
      expect.objectContaining({
        params: expect.objectContaining({
          period_type: 'recent',
          limit: 30,
        }),
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token-123',
        }),
      })
    );

    expect(wrapper.text()).toContain('直近30戦の成績');
  });

  it('トークンがない場合にエラーメッセージを表示する', async () => {
    router = createRouterWithQuery();

    await router.push({
      path: '/obs-overlay',
      query: {
        period_type: 'recent',
        limit: '30',
      },
    });

    const wrapper = mount(OBSOverlayView, {
      global: {
        plugins: [vuetify, router],
      },
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('URLにトークンが含まれていません');
    expect(axios.get).not.toHaveBeenCalled();
  });

  it('period_typeが"monthly"の場合に年月パラメータを送信する', async () => {
    const mockStats = {
      current_deck: 'ライゼル',
      total_duels: 50,
      win_rate: 0.6,
    };

    vi.mocked(axios.get).mockResolvedValue({ data: mockStats });

    router = createRouterWithQuery();

    await router.push({
      path: '/obs-overlay',
      query: {
        token: 'test-token-123',
        period_type: 'monthly',
        year: '2025',
        month: '10',
      },
    });

    mount(OBSOverlayView, {
      global: {
        plugins: [vuetify, router],
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('/statistics/obs'),
      expect.objectContaining({
        params: expect.objectContaining({
          period_type: 'monthly',
          year: 2025,
          month: 10,
        }),
      })
    );
  });

  it('game_modeパラメータがある場合に送信する', async () => {
    const mockStats = {
      total_duels: 30,
      win_rate: 0.5,
    };

    vi.mocked(axios.get).mockResolvedValue({ data: mockStats });

    router = createRouterWithQuery();

    await router.push({
      path: '/obs-overlay',
      query: {
        token: 'test-token-123',
        game_mode: 'RANK',
      },
    });

    mount(OBSOverlayView, {
      global: {
        plugins: [vuetify, router],
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('/statistics/obs'),
      expect.objectContaining({
        params: expect.objectContaining({
          game_mode: 'RANK',
        }),
      })
    );
  });

  it('display_itemsパラメータで表示項目をフィルタリングする', async () => {
    const mockStats = {
      current_deck: 'ライゼル',
      win_rate: 0.55,
      total_duels: 100,
    };

    vi.mocked(axios.get).mockResolvedValue({ data: mockStats });

    router = createRouterWithQuery();

    await router.push({
      path: '/obs-overlay',
      query: {
        token: 'test-token-123',
        display_items: 'current_deck,win_rate',
      },
    });

    const wrapper = mount(OBSOverlayView, {
      global: {
        plugins: [vuetify, router],
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    // 選択された項目のみ表示される
    expect(wrapper.text()).toContain('使用デッキ');
    expect(wrapper.text()).toContain('勝率');
  });

  it('横1列レイアウト(layout=horizontal)が正しく適用される', async () => {
    const mockStats = {
      total_duels: 100,
      win_rate: 0.55,
    };

    vi.mocked(axios.get).mockResolvedValue({ data: mockStats });

    router = createRouterWithQuery();

    await router.push({
      path: '/obs-overlay',
      query: {
        token: 'test-token-123',
        layout: 'horizontal',
      },
    });

    const wrapper = mount(OBSOverlayView, {
      global: {
        plugins: [vuetify, router],
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(wrapper.find('.obs-overlay').classes()).toContain('layout-horizontal');
    expect(wrapper.find('.stats-card').classes()).toContain('layout-horizontal');
  });

  it('縦1列レイアウト(layout=vertical)が正しく適用される', async () => {
    const mockStats = {
      total_duels: 100,
      win_rate: 0.55,
    };

    vi.mocked(axios.get).mockResolvedValue({ data: mockStats });

    router = createRouterWithQuery();

    await router.push({
      path: '/obs-overlay',
      query: {
        token: 'test-token-123',
        layout: 'vertical',
      },
    });

    const wrapper = mount(OBSOverlayView, {
      global: {
        plugins: [vuetify, router],
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(wrapper.find('.obs-overlay').classes()).toContain('layout-vertical');
    expect(wrapper.find('.stats-card').classes()).toContain('layout-vertical');
  });

  it('APIエラー時にエラーメッセージを表示する', async () => {
    vi.mocked(axios.get).mockRejectedValue({
      response: {
        status: 401,
        data: { detail: 'Invalid token' },
      },
      message: 'Request failed',
    });

    router = createRouterWithQuery();

    await router.push({
      path: '/obs-overlay',
      query: {
        token: 'test-token-123',
      },
    });

    const wrapper = mount(OBSOverlayView, {
      global: {
        plugins: [vuetify, router],
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(wrapper.text()).toContain('認証エラー');
  });

  it('ランク名を正しく表示する', async () => {
    const mockStats = {
      current_deck: 'ライゼル',
      current_rank: 'MASTER_5',
      total_duels: 100,
      win_rate: 0.55,
      first_turn_win_rate: 0.52,
      second_turn_win_rate: 0.58,
      coin_win_rate: 0.5,
      go_first_rate: 0.48,
    };

    vi.mocked(axios.get).mockResolvedValue({ data: mockStats });

    router = createRouterWithQuery();

    await router.push({
      path: '/obs-overlay',
      query: {
        token: 'test-token-123',
      },
    });

    const wrapper = mount(OBSOverlayView, {
      global: {
        plugins: [vuetify, router],
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    // ランクラベルが表示されることを確認
    expect(wrapper.text()).toContain('ランク');
    // current_rankが含まれていることを確認（表示名のテストはgetRankName関数のテストで行う）
  });

  it('パーセント値が正しくフォーマットされる', async () => {
    const mockStats = {
      win_rate: 0.567,
      first_turn_win_rate: 0.523,
      total_duels: 100,
    };

    vi.mocked(axios.get).mockResolvedValue({ data: mockStats });

    router = createRouterWithQuery();

    await router.push({
      path: '/obs-overlay',
      query: {
        token: 'test-token-123',
      },
    });

    const wrapper = mount(OBSOverlayView, {
      global: {
        plugins: [vuetify, router],
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(wrapper.text()).toContain('56.7%');
    expect(wrapper.text()).toContain('52.3%');
  });
});
