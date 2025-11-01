import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { createTestingPinia } from '@pinia/testing';
import DashboardView from '../DashboardView.vue';

import { api } from '@/services/api';

// Mock API and stores
vi.mock('@/services/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

const vuetify = createVuetify({ components, directives });

const stubs = {
  AppBar: true,
  DashboardHeader: true,
  StatisticsSection: true,
  DuelHistorySection: true,
  OBSSection: true,
  ShareStatsDialog: true,
  VNavigationDrawer: true,
  VMain: { template: '<div><slot /></div>' },
  VContainer: { template: '<div><slot /></div>' },
};

describe('DashboardView.vue', () => {
  let pinia: ReturnType<typeof createTestingPinia>;

  const mockDecks = [
    { id: 1, name: 'Test Deck', is_opponent: false, active: true },
    { id: 2, name: 'Opponent Deck', is_opponent: true, active: true },
  ];
  const mockDuels = [
    {
      id: 1,
      deck_id: 1,
      opponent_deck_id: 2,
      result: true,
      game_mode: 'RANK' as const,
      deck: mockDecks[0],
      opponent_deck: mockDecks[1],
    },
  ];

  beforeEach(() => {
    pinia = createTestingPinia({
      createSpy: vi.fn,
      initialState: {
        auth: { isAuthenticated: true },
      },
    });

    vi.clearAllMocks();

    // Mock API calls for fetchDuels
    vi.mocked(api.get).mockImplementation(async (url) => {
      if (url.includes('/duels')) {
        return { data: mockDuels };
      }
      if (url.includes('/decks')) {
        return { data: mockDecks };
      }
      return { data: [] };
    });
  });

  it('renders all child section components', async () => {
    const wrapper = mount(DashboardView, {
      global: {
        plugins: [vuetify, pinia],
        stubs,
      },
    });

    await flushPromises();

    expect(wrapper.findComponent({ name: 'DashboardHeader' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'StatisticsSection' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'DuelHistorySection' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'OBSSection' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'ShareStatsDialog' }).exists()).toBe(true);
  });

  it('fetches duels and decks on mount', async () => {
    mount(DashboardView, {
      global: {
        plugins: [vuetify, pinia],
        stubs,
      },
    });

    await flushPromises();

    expect(api.get).toHaveBeenCalledWith('/duels/', expect.any(Object));
    expect(api.get).toHaveBeenCalledWith('/decks/');
  });

  it('passes correct props to child components', async () => {
    const wrapper = mount(DashboardView, {
      global: {
        plugins: [vuetify, pinia],
        stubs,
      },
    });

    await flushPromises();

    const statisticsSection = wrapper.findComponent({ name: 'StatisticsSection' });
    const expectedDuels = [
      {
        id: 1,
        deck_id: 1,
        opponent_deck_id: 2,
        result: true,
        game_mode: 'RANK',
        deck: mockDecks[0],
        opponent_deck: mockDecks[1],
      },
    ];
    expect(statisticsSection.props('duels')).toEqual(expectedDuels);
    expect(statisticsSection.props('decks')).toEqual(mockDecks);
    expect(statisticsSection.props('currentMode')).toBe('RANK');

    const duelHistorySection = wrapper.findComponent({ name: 'DuelHistorySection' });
    expect(duelHistorySection.props('duels')).toEqual(expectedDuels); // Initially, currentDuels will be the same as duels
    expect(duelHistorySection.props('decks')).toEqual(mockDecks);
    expect(duelHistorySection.props('loading')).toBe(false);
  });

  it('refetches duels when date is updated from DashboardHeader', async () => {
    const wrapper = mount(DashboardView, {
      global: {
        plugins: [vuetify, pinia],
        stubs,
      },
    });

    await flushPromises();
    vi.clearAllMocks(); // Clear initial fetch calls

    const header = wrapper.findComponent({ name: 'DashboardHeader' });
    await header.vm.$emit('update:year', 2023);

    expect(api.get).toHaveBeenCalledWith('/duels/', {
      params: { year: 2023, month: new Date().getMonth() + 1 },
    });
  });
});
