import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { createTestingPinia } from '@pinia/testing';
import StatisticsView from '../StatisticsView.vue';
import { api } from '../../services/api';

vi.mock('../../services/api');

const vuetify = createVuetify({ components, directives });

describe('StatisticsView.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const mockStats = {
      RANK: {
        monthly_deck_distribution: [],
        recent_deck_distribution: [],
        matchup_data: [
          {
            deck_name: 'A',
            opponent_deck_name: 'B',
            total_duels: 10,
            wins: 6,
            win_rate: 60,
            win_rate_first: 70,
            win_rate_second: 40,
          },
          {
            deck_name: 'C',
            opponent_deck_name: 'D',
            total_duels: 10,
            wins: 5,
            win_rate: 50,
            win_rate_first: 50,
            win_rate_second: 50,
          },
        ],
        my_deck_win_rates: [
          {
            deck_name: 'MyDeck',
            total_duels: 20,
            wins: 12,
            win_rate: 60,
          },
          {
            deck_name: 'MyDeck2',
            total_duels: 10,
            wins: 4,
            win_rate: 40,
          },
        ],
        value_sequence_data: [],
      },
      RATE: {
        monthly_deck_distribution: [],
        recent_deck_distribution: [],
        matchup_data: [],
        value_sequence_data: [],
      },
      EVENT: {
        monthly_deck_distribution: [],
        recent_deck_distribution: [],
        matchup_data: [],
        value_sequence_data: [],
      },
      DC: {
        monthly_deck_distribution: [],
        recent_deck_distribution: [],
        matchup_data: [],
        value_sequence_data: [],
      },
    };

    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === '/statistics/available-decks') {
        return Promise.resolve({ data: { my_decks: [], opponent_decks: [] } });
      }
      return Promise.resolve({ data: mockStats });
    });
  });

  it('renders correctly and fetches statistics on mount', async () => {
    const wrapper = mount(StatisticsView, {
      global: {
        plugins: [vuetify, createTestingPinia({ createSpy: vi.fn })],
        stubs: {
          AppBar: true,
          apexchart: true,
          VNavigationDrawer: true,
          VMain: { template: '<div><slot /></div>' },
          VContainer: { template: '<div><slot /></div>' },
        },
      },
    });
    await flushPromises();

    expect(api.get).toHaveBeenCalledWith('/statistics/available-decks', expect.any(Object));
    expect(api.get).toHaveBeenCalledWith('/statistics', expect.any(Object));
    expect(wrapper.text()).toContain('統計情報');

    const chips = wrapper.findAllComponents({ name: 'VChip' });
    const percentChips = chips.filter((chip) => chip.text().includes('%'));

    const winRateChip = percentChips.find((chip) => chip.text().includes('60.0%'));
    expect(winRateChip?.props('color')).toBe('info');

    const firstChip = percentChips.find((chip) => chip.text().includes('70.0%'));
    expect(firstChip?.props('color')).toBe('info');

    const secondChip = percentChips.find((chip) => chip.text().includes('40.0%'));
    expect(secondChip?.props('color')).toBe('error');

    const neutralChip = percentChips.find((chip) => chip.text().includes('50.0%'));
    expect(neutralChip?.props('color')).toBeUndefined();

    const myDeckChip = percentChips.find((chip) => chip.text().includes('12 / 20'));
    expect(myDeckChip?.props('color')).toBe('info');

    const myDeckChip2 = percentChips.find((chip) => chip.text().includes('4 / 10'));
    expect(myDeckChip2?.props('color')).toBe('error');
  });

  describe('Performance optimizations', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('debounces filter changes and fires request only once', async () => {
      const wrapper = mount(StatisticsView, {
        global: {
          plugins: [vuetify, createTestingPinia({ createSpy: vi.fn })],
          stubs: {
            AppBar: true,
            apexchart: true,
            VNavigationDrawer: true,
            VMain: { template: '<div><slot /></div>' },
            VContainer: { template: '<div><slot /></div>' },
          },
        },
      });
      await flushPromises();

      // Clear initial mount calls
      vi.clearAllMocks();

      // Simulate rapid filter changes
      const yearSelect = wrapper.findComponent({ name: 'VSelect' });
      await yearSelect.vm.$emit('update:modelValue', 2024);
      await yearSelect.vm.$emit('update:modelValue', 2023);
      await yearSelect.vm.$emit('update:modelValue', 2022);

      // No API calls should happen immediately
      expect(api.get).not.toHaveBeenCalled();

      // Fast-forward time by 400ms (debounce delay)
      vi.advanceTimersByTime(400);
      await flushPromises();

      // Only one set of API calls should be made (last change)
      expect(api.get).toHaveBeenCalledTimes(3); // available-decks, statistics, duels
    });

    it('executes multiple APIs in parallel', async () => {
      const mockApiGet = vi.mocked(api.get);
      let resolveAvailableDecks: (value: any) => void;
      let resolveStatistics: (value: any) => void;
      let resolveDuels: (value: any) => void;

      mockApiGet.mockImplementation((url: string) => {
        if (url === '/statistics/available-decks') {
          return new Promise((resolve) => {
            resolveAvailableDecks = resolve;
          });
        } else if (url === '/statistics') {
          return new Promise((resolve) => {
            resolveStatistics = resolve;
          });
        } else if (url === '/duels/') {
          return new Promise((resolve) => {
            resolveDuels = resolve;
          });
        }
        return Promise.resolve({ data: {} });
      });

      mount(StatisticsView, {
        global: {
          plugins: [vuetify, createTestingPinia({ createSpy: vi.fn })],
          stubs: {
            AppBar: true,
            apexchart: true,
            VNavigationDrawer: true,
            VMain: { template: '<div><slot /></div>' },
            VContainer: { template: '<div><slot /></div>' },
          },
        },
      });

      // Wait for component to mount and trigger initial requests
      await flushPromises();

      // All three API calls should have been initiated in parallel
      expect(api.get).toHaveBeenCalledWith('/statistics/available-decks', expect.any(Object));
      expect(api.get).toHaveBeenCalledWith('/statistics', expect.any(Object));
      expect(api.get).toHaveBeenCalledWith('/duels/', expect.any(Object));

      // Resolve all promises
      resolveAvailableDecks!({ data: { my_decks: [], opponent_decks: [] } });
      resolveStatistics!({
        data: {
          RANK: { monthly_deck_distribution: [], matchup_data: [], value_sequence_data: [] },
          RATE: { monthly_deck_distribution: [], matchup_data: [], value_sequence_data: [] },
          EVENT: { monthly_deck_distribution: [], matchup_data: [], value_sequence_data: [] },
          DC: { monthly_deck_distribution: [], matchup_data: [], value_sequence_data: [] },
        },
      });
      resolveDuels!({ data: [] });

      await flushPromises();
    });

    it('skips refetch when parameters are unchanged', async () => {
      const wrapper = mount(StatisticsView, {
        global: {
          plugins: [vuetify, createTestingPinia({ createSpy: vi.fn })],
          stubs: {
            AppBar: true,
            apexchart: true,
            VNavigationDrawer: true,
            VMain: { template: '<div><slot /></div>' },
            VContainer: { template: '<div><slot /></div>' },
          },
        },
      });
      await flushPromises();

      const initialCallCount = vi.mocked(api.get).mock.calls.length;

      // Trigger refresh with same parameters
      const yearSelect = wrapper.findComponent({ name: 'VSelect' });
      await yearSelect.vm.$emit('update:modelValue', new Date().getFullYear());

      vi.advanceTimersByTime(400);
      await flushPromises();

      // No additional API calls should be made
      expect(vi.mocked(api.get).mock.calls.length).toBe(initialCallCount);
    });
  });
});
