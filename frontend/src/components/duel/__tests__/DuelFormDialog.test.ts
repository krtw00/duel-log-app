import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import DuelFormDialog from '../DuelFormDialog.vue';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { createTestingPinia } from '@pinia/testing';
import { api } from '@/services/api';

const vuetify = createVuetify({
  components,
  directives,
});

vi.mock('@/services/api');

describe('DuelFormDialog.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with required props', () => {
    const wrapper = mount(DuelFormDialog, {
      global: {
        plugins: [vuetify, createTestingPinia()],
      },
      props: {
        modelValue: true,
        defaultGameMode: 'RANK',
        duel: null,
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('does not render when modelValue is false', () => {
    const wrapper = mount(DuelFormDialog, {
      global: {
        plugins: [vuetify, createTestingPinia()],
      },
      props: {
        modelValue: false,
        defaultGameMode: 'RANK',
        duel: null,
      },
    });

    // ダイアログが閉じているときは、カード要素が存在しない
    expect(wrapper.find('.duel-form-card').exists()).toBe(false);
  });

  it('has fullscreen mode on mobile', () => {
    const wrapper = mount(DuelFormDialog, {
      global: {
        plugins: [vuetify, createTestingPinia()],
      },
      props: {
        modelValue: true,
        defaultGameMode: 'RANK',
        duel: null,
      },
    });

    const dialog = wrapper.findComponent({ name: 'VDialog' });
    expect(dialog.exists()).toBe(true);
    // fullscreen プロパティが存在することを確認
    expect(dialog.props()).toHaveProperty('fullscreen');
  });

  it('emits update:modelValue when closing', async () => {
    const wrapper = mount(DuelFormDialog, {
      global: {
        plugins: [vuetify, createTestingPinia()],
      },
      props: {
        modelValue: true,
        defaultGameMode: 'RANK',
        duel: null,
      },
    });

    // closeDialog を直接呼び出す
    (wrapper.vm as any).closeDialog();

    expect(wrapper.emitted()['update:modelValue']).toBeTruthy();
    expect(wrapper.emitted()['update:modelValue'][0]).toEqual([false]);
  });

  it('accepts duel prop for editing', () => {
    const mockDuel = {
      id: 1,
      deck_id: 1,
      opponent_deck_id: 2,
      is_win: true,
      game_mode: 'RANK' as const,
      rank: 18,
      won_coin_toss: true,
      is_going_first: true,
      played_date: '2023-01-01T12:00:00Z',
      notes: 'Test notes',
      create_date: '2023-01-01T12:00:00Z',
      update_date: '2023-01-01T12:00:00Z',
      user_id: 1,
      deck: { id: 1, name: 'My Deck', is_opponent: false, active: true, user_id: 1 },
      opponent_deck: { id: 2, name: 'Opponent Deck', is_opponent: true, active: true, user_id: 1 },
    };

    const wrapper = mount(DuelFormDialog, {
      global: {
        plugins: [vuetify, createTestingPinia()],
      },
      props: {
        modelValue: true,
        defaultGameMode: 'RANK',
        duel: mockDuel,
      },
    });

    expect(wrapper.props('duel')).toEqual(mockDuel);
  });

  it('prefills edit form without waiting for deck fetch', async () => {
    // Deck fetch never resolves, but edit prefill should still happen immediately.
    (api.get as any).mockImplementation(() => new Promise(() => {}));

    const mockDuel = {
      id: 1,
      deck_id: 1,
      opponent_deck_id: 2,
      is_win: true,
      game_mode: 'RANK' as const,
      rank: 18,
      won_coin_toss: true,
      is_going_first: true,
      played_date: '2023-01-01T12:00:00Z',
      notes: 'Test notes',
      create_date: '2023-01-01T12:00:00Z',
      update_date: '2023-01-01T12:00:00Z',
      user_id: 1,
      deck: { id: 1, name: 'My Deck', is_opponent: false, active: true, user_id: 1 },
      opponent_deck: { id: 2, name: 'Opponent Deck', is_opponent: true, active: true, user_id: 1 },
    };

    const wrapper = mount(DuelFormDialog, {
      global: {
        plugins: [vuetify, createTestingPinia()],
      },
      props: {
        modelValue: false,
        defaultGameMode: 'RANK',
        duel: mockDuel,
      },
    });

    await wrapper.setProps({ modelValue: true });
    await wrapper.vm.$nextTick();

    expect((wrapper.vm as any).form.deck_id).toBe(1);
    expect((wrapper.vm as any).form.opponent_deck_id).toBe(2);
    expect((wrapper.vm as any).selectedMyDeck).toEqual(mockDuel.deck);
    expect((wrapper.vm as any).selectedOpponentDeck).toEqual(mockDuel.opponent_deck);
  });

  it('does not refetch decks on re-open once loaded', async () => {
    (api.get as any).mockResolvedValue({ data: [] });

    const mockDuel = {
      id: 1,
      deck_id: 1,
      opponent_deck_id: 2,
      is_win: true,
      game_mode: 'RANK' as const,
      rank: 18,
      won_coin_toss: true,
      is_going_first: true,
      played_date: '2023-01-01T12:00:00Z',
      notes: 'Test notes',
      create_date: '2023-01-01T12:00:00Z',
      update_date: '2023-01-01T12:00:00Z',
      user_id: 1,
    };

    const wrapper = mount(DuelFormDialog, {
      global: {
        plugins: [vuetify, createTestingPinia()],
      },
      props: {
        modelValue: false,
        defaultGameMode: 'RANK',
        duel: mockDuel,
      },
    });

    await wrapper.setProps({ modelValue: true });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(api.get).toHaveBeenCalledTimes(2);

    await wrapper.setProps({ modelValue: false });
    await wrapper.vm.$nextTick();
    await wrapper.setProps({ modelValue: true });
    await wrapper.vm.$nextTick();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(api.get).toHaveBeenCalledTimes(2);
  });

  it('auto-sets turn order based on coin in create mode', async () => {
    const wrapper = mount(DuelFormDialog, {
      global: {
        plugins: [vuetify, createTestingPinia()],
      },
      props: {
        modelValue: true,
        defaultGameMode: 'RANK',
        duel: null,
      },
    });

    await wrapper.vm.$nextTick();

    // coin=1 -> first=1
    (wrapper.vm as any).form.coin = 1;
    await wrapper.vm.$nextTick();
    expect((wrapper.vm as any).form.first_or_second).toBe(1);

    // coin=0 -> first=0
    (wrapper.vm as any).form.coin = 0;
    await wrapper.vm.$nextTick();
    expect((wrapper.vm as any).form.first_or_second).toBe(0);
  });

  it('uses defaultCoin as initial coin value in create mode', async () => {
    const wrapper = mount(DuelFormDialog, {
      global: {
        plugins: [vuetify, createTestingPinia()],
      },
      props: {
        modelValue: true,
        defaultGameMode: 'RANK',
        defaultFirstOrSecond: 0,
        duel: null,
      },
    });

    await wrapper.vm.$nextTick();

    // coinの初期値は常に「表」
    expect((wrapper.vm as any).form.coin).toBe(1);
    expect((wrapper.vm as any).form.first_or_second).toBe(0);
  });

  it('does not prefill opponent deck in create mode', async () => {
    const myDeck = { id: 1, name: 'My Deck', is_opponent: false, active: true, user_id: 1 };
    const opponentDeck = {
      id: 2,
      name: 'Opponent Deck',
      is_opponent: true,
      active: true,
      user_id: 1,
    };

    (api.get as any).mockImplementation((url: string) => {
      if (url.includes('/decks/?is_opponent=false')) return Promise.resolve({ data: [myDeck] });
      if (url.includes('/decks/?is_opponent=true')) return Promise.resolve({ data: [opponentDeck] });
      if (url === '/duels/latest-values/') {
        return Promise.resolve({
          data: {
            RANK: { value: 18, deck_id: 1, opponent_deck_id: 2 },
          },
        });
      }
      return Promise.resolve({ data: [] });
    });

    const wrapper = mount(DuelFormDialog, {
      global: {
        plugins: [vuetify, createTestingPinia()],
      },
      props: {
        modelValue: false,
        defaultGameMode: 'RANK',
        duel: null,
      },
    });

    await wrapper.setProps({ modelValue: true });
    await new Promise((resolve) => setTimeout(resolve, 0));
    await wrapper.vm.$nextTick();

    expect((wrapper.vm as any).selectedMyDeck).toEqual(myDeck);
    expect((wrapper.vm as any).selectedOpponentDeck).toBe(null);
  });

  it('sets turn order from default when coin is heads and uses second on tails', async () => {
    const wrapper = mount(DuelFormDialog, {
      global: {
        plugins: [vuetify, createTestingPinia()],
      },
      props: {
        modelValue: true,
        defaultGameMode: 'RANK',
        defaultFirstOrSecond: 0, // default: 後攻
        duel: null,
      },
    });

    await wrapper.vm.$nextTick();

    // 表ならデフォルト（後攻）
    (wrapper.vm as any).form.coin = 1;
    await wrapper.vm.$nextTick();
    expect((wrapper.vm as any).form.first_or_second).toBe(0);

    // 裏でも後攻
    (wrapper.vm as any).form.coin = 0;
    await wrapper.vm.$nextTick();
    expect((wrapper.vm as any).form.first_or_second).toBe(0);
  });
});
