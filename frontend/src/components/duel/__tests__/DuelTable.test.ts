import { describe, it, expect } from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import DuelTable from '../DuelTable.vue';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { Duel } from '@/types';

const vuetify = createVuetify({
  components,
  directives,
});

describe('DuelTable.vue', () => {
  const mockDuels: Duel[] = [
    {
      id: 1,
      deck_id: 1,
      opponent_deck_id: 2,
      is_win: true,
      game_mode: 'RANK',
      rank: 18,
      won_coin_toss: true,
      is_going_first: true,
      played_date: '2023-10-26T10:00:00Z',
      notes: 'Win against Eldlich',
      create_date: '2023-10-26T10:00:00Z',
      update_date: '2023-10-26T10:00:00Z',
      user_id: 'test-user-uuid',
      deck: { id: 1, name: 'My Deck', is_opponent: false, active: true },
      opponent_deck: { id: 2, name: 'Opponent Deck', is_opponent: true, active: true },
    },
    {
      id: 2,
      deck_id: 1,
      opponent_deck_id: 3,
      is_win: false,
      game_mode: 'RATE',
      rate_value: 1500,
      won_coin_toss: false,
      is_going_first: false,
      played_date: '2023-10-25T15:30:00Z',
      notes: 'Lose to Branded Despia',
      create_date: '2023-10-25T15:30:00Z',
      update_date: '2023-10-25T15:30:00Z',
      user_id: 'test-user-uuid',
      deck: { id: 1, name: 'My Deck', is_opponent: false, active: true },
      opponent_deck: { id: 3, name: 'Another Opponent Deck', is_opponent: true, active: true },
    },
  ];

  it('renders duel data correctly', () => {
    const wrapper = mount(DuelTable, {
      global: {
        plugins: [vuetify, createTestingPinia()],
      },
      props: {
        duels: mockDuels,
        loading: false,
      },
    });

    expect(wrapper.text()).toContain('My Deck');
    expect(wrapper.text()).toContain('Opponent Deck');
    expect(wrapper.text()).toContain('勝利');
    expect(wrapper.text()).toContain('敗北');
    expect(wrapper.text()).toContain('プラチナ5'); // Rank 18
    expect(wrapper.text()).toContain('1500'); // Rate value
  });

  it('displays loading skeleton when loading is true', () => {
    const wrapper = mount(DuelTable, {
      global: {
        plugins: [vuetify, createTestingPinia()],
      },
      props: {
        duels: [],
        loading: true,
      },
    });

    expect(wrapper.findComponent({ name: 'VSkeletonLoader' }).exists()).toBe(true);
  });

  it('displays no data message when duels array is empty and not loading', () => {
    const wrapper = mount(DuelTable, {
      global: {
        plugins: [vuetify, createTestingPinia()],
      },
      props: {
        duels: [],
        loading: false,
      },
    });

    expect(wrapper.text()).toContain('対戦記録がありません');
  });

  it('emits edit event with duel object when edit button is clicked', async () => {
    const wrapper = mount(DuelTable, {
      global: {
        plugins: [vuetify, createTestingPinia()],
      },
      props: {
        duels: mockDuels,
        loading: false,
        showActions: true,
      },
    });

    await wrapper.findAll('.v-btn')[0].trigger('click'); // First edit button
    expect(wrapper.emitted().edit).toBeTruthy();
    expect((wrapper.emitted().edit as any)[0][0]).toEqual(mockDuels[0]);
  });

  it('emits delete event with duel id when delete button is clicked', async () => {
    const wrapper = mount(DuelTable, {
      global: {
        plugins: [vuetify, createTestingPinia()],
      },
      props: {
        duels: mockDuels,
        loading: false,
        showActions: true,
      },
    });

    await wrapper.findAll('.v-btn')[1].trigger('click'); // First delete button
    expect(wrapper.emitted().delete).toBeTruthy();
    expect((wrapper.emitted().delete as any)[0][0]).toBe(mockDuels[0].id);
  });

  it('has mobile-breakpoint attribute for responsive design', () => {
    const wrapper = mount(DuelTable, {
      global: {
        plugins: [vuetify, createTestingPinia()],
      },
      props: {
        duels: mockDuels,
        loading: false,
      },
    });

    const dataTable = wrapper.findComponent({ name: 'VDataTable' });
    expect(dataTable.exists()).toBe(true);
    // mobile-breakpointが設定されていることを確認
    expect(dataTable.props('mobileBreakpoint')).toBe('sm');
  });

  it('renders table with responsive styling', () => {
    const wrapper = mount(DuelTable, {
      global: {
        plugins: [vuetify, createTestingPinia()],
      },
      props: {
        duels: mockDuels,
        loading: false,
      },
    });

    // テーブルが正しくレンダリングされていることを確認
    const dataTable = wrapper.findComponent({ name: 'VDataTable' });
    expect(dataTable.exists()).toBe(true);

    // レスポンシブクラスが適用されていることを確認
    expect(wrapper.find('.duel-table').exists()).toBe(true);
  });
});
