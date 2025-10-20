import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
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
    const mockData = {
      RANK: { monthly_deck_distribution: [], recent_deck_distribution: [], matchup_data: [], time_series_data: [] },
      RATE: { monthly_deck_distribution: [], recent_deck_distribution: [], matchup_data: [], time_series_data: [] },
      EVENT: { monthly_deck_distribution: [], recent_deck_distribution: [], matchup_data: [], time_series_data: [] },
      DC: { monthly_deck_distribution: [], recent_deck_distribution: [], matchup_data: [], time_series_data: [] },
    };
    vi.mocked(api.get).mockResolvedValue({ data: mockData });
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
    await wrapper.vm.$nextTick(); // Wait for onMounted hook
    expect(api.get).toHaveBeenCalledWith('/statistics/', expect.any(Object));
    expect(wrapper.text()).toContain('統計情報');
  });
});
