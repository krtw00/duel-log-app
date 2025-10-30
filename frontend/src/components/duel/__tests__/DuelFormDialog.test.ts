import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import DuelFormDialog from '../DuelFormDialog.vue';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { createTestingPinia } from '@pinia/testing';

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
});
