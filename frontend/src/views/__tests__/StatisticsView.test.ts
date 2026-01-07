import { describe, it, expect, vi, beforeEach } from 'vitest';
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
    expect(api.get).toHaveBeenCalledWith('/statistics/', expect.any(Object));
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
});
