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
      RANK: { monthly_deck_distribution: [], recent_deck_distribution: [], matchup_data: [], time_series_data: [] },
      RATE: { monthly_deck_distribution: [], recent_deck_distribution: [], matchup_data: [], time_series_data: [] },
      EVENT: { monthly_deck_distribution: [], recent_deck_distribution: [], matchup_data: [], time_series_data: [] },
      DC: { monthly_deck_distribution: [], recent_deck_distribution: [], matchup_data: [], time_series_data: [] },
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
          VContainer: { template: '<div><slot /></div>' }
        },
      },
    });
    await flushPromises();

    expect(api.get).toHaveBeenCalledWith('/statistics/available-decks', expect.any(Object));
    expect(api.get).toHaveBeenCalledWith('/statistics/', expect.any(Object));
    expect(wrapper.text()).toContain('統計情報');
  });
});
