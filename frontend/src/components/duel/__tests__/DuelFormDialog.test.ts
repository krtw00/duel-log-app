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
    expect(wrapper.findComponent({ name: 'VTabs' }).exists()).toBe(false);
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
    expect(wrapper.findComponent({ name: 'VTabs' }).exists()).toBe(false);
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

  it('prefills decks in create mode and filters by current user', async () => {
    const myDeck = { id: 1, name: 'My Deck', is_opponent: false, active: true, user_id: 1 };
    const otherUsersMyDeck = {
      id: 999,
      name: 'Other My Deck',
      is_opponent: false,
      active: true,
      user_id: 2,
    };
    const opponentDeck = {
      id: 2,
      name: 'Opponent Deck',
      is_opponent: true,
      active: true,
      user_id: 1,
    };
    const otherUsersOpponentDeck = {
      id: 998,
      name: 'Other Opponent Deck',
      is_opponent: true,
      active: true,
      user_id: 2,
    };

    (api.get as any).mockImplementation((url: string) => {
      if (url.includes('/decks/?is_opponent=false'))
        return Promise.resolve({ data: [myDeck, otherUsersMyDeck] });
      if (url.includes('/decks/?is_opponent=true'))
        return Promise.resolve({ data: [opponentDeck, otherUsersOpponentDeck] });
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
        plugins: [
          vuetify,
          createTestingPinia({
            initialState: {
              auth: {
                user: {
                  id: 1,
                  email: 'test@example.com',
                  username: 'testuser',
                  streamer_mode: false,
                  theme_preference: 'dark',
                },
                isInitialized: true,
              },
            },
          }),
        ],
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
    // 相手デッキは登録後に空欄にするため、自動設定されない
    expect((wrapper.vm as any).selectedOpponentDeck).toBeNull();
    expect((wrapper.vm as any).myDeckItems).toEqual([myDeck]);
    expect((wrapper.vm as any).opponentDeckItems).toEqual([opponentDeck]);
  });

  it('does not show archived decks in edit mode (except selected)', async () => {
    const activeMyDeck = {
      id: 1,
      name: 'Active My Deck',
      is_opponent: false,
      active: true,
      user_id: 1,
    };
    const archivedMyDeck = {
      id: 2,
      name: 'Archived My Deck',
      is_opponent: false,
      active: false,
      user_id: 1,
    };
    const otherUsersArchivedMyDeck = {
      id: 999,
      name: 'Other Archived My Deck',
      is_opponent: false,
      active: false,
      user_id: 2,
    };

    const activeOpponentDeck = {
      id: 3,
      name: 'Active Opponent Deck',
      is_opponent: true,
      active: true,
      user_id: 1,
    };
    const archivedOpponentDeck = {
      id: 4,
      name: 'Archived Opponent Deck',
      is_opponent: true,
      active: false,
      user_id: 1,
    };
    const otherUsersArchivedOpponentDeck = {
      id: 998,
      name: 'Other Archived Opponent Deck',
      is_opponent: true,
      active: false,
      user_id: 2,
    };

    (api.get as any).mockImplementation((url: string) => {
      if (url.includes('/decks/?is_opponent=false'))
        return Promise.resolve({ data: [activeMyDeck, archivedMyDeck, otherUsersArchivedMyDeck] });
      if (url.includes('/decks/?is_opponent=true'))
        return Promise.resolve({
          data: [activeOpponentDeck, archivedOpponentDeck, otherUsersArchivedOpponentDeck],
        });
      return Promise.resolve({ data: [] });
    });

    const mockDuel = {
      id: 1,
      deck_id: 2,
      opponent_deck_id: 4,
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
      deck: archivedMyDeck,
      opponent_deck: archivedOpponentDeck,
    };

    const wrapper = mount(DuelFormDialog, {
      global: {
        plugins: [
          vuetify,
          createTestingPinia({
            initialState: {
              auth: {
                user: {
                  id: 1,
                  email: 'test@example.com',
                  username: 'testuser',
                  streamer_mode: false,
                  theme_preference: 'dark',
                },
                isInitialized: true,
              },
            },
          }),
        ],
      },
      props: {
        modelValue: true,
        defaultGameMode: 'RANK',
        duel: mockDuel,
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    await wrapper.vm.$nextTick();

    expect((wrapper.vm as any).myDeckItems).toEqual([activeMyDeck, archivedMyDeck]);
    expect((wrapper.vm as any).opponentDeckItems).toEqual([
      activeOpponentDeck,
      archivedOpponentDeck,
    ]);
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
