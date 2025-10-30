import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { createTestingPinia } from '@pinia/testing';
import SharedStatisticsView from '../SharedStatisticsView.vue';
import { useSharedStatisticsStore } from '../../stores/shared_statistics';
import { useRoute } from 'vue-router';

// Mock environment variables before any imports that use them
vi.mock('../../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock vue-router
vi.mock('vue-router', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    useRoute: vi.fn(() => ({ params: { share_id: 'test_share_id' } })),
  };
});

const vuetify = createVuetify({
  components,
  directives,
});

describe('SharedStatisticsView.vue', () => {
  let sharedStatisticsStore: ReturnType<typeof useSharedStatisticsStore>;
  let pinia: ReturnType<typeof createTestingPinia>;

  beforeEach(() => {
    pinia = createTestingPinia({
      createSpy: vi.fn,
      stubActions: false,
    });
    sharedStatisticsStore = useSharedStatisticsStore();
    vi.clearAllMocks();
    // Reset mock for useRoute for each test
    vi.mocked(useRoute).mockReturnValue({ params: { share_id: 'test_share_id' } } as any);
  });

  it('renders correctly with a simple app bar', () => {
    const wrapper = mount(SharedStatisticsView, {
      global: {
        plugins: [vuetify, pinia],
        stubs: {
          apexchart: true,
          VNavigationDrawer: true,
          VMain: { template: '<div><slot /></div>' },
          VAppBar: {
            template:
              '<div class="v-app-bar"><div class="v-toolbar-title"><slot /></slot></div></div>',
          },
          VContainer: { template: '<div><slot /></div>' },
        },
      },
    });
    expect(wrapper.find('.v-app-bar').exists()).toBe(true);
    expect(wrapper.find('.v-toolbar-title').text()).toContain('Duel Log Shared Statistics');
  });

  it('fetches and displays shared statistics on mount', async () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const mockStatsData = {
      STATISTICS: {
        year: currentYear,
        month: currentMonth,
        monthly_deck_distribution: [{ deck_name: 'Deck A', count: 10 }],
        recent_deck_distribution: [{ deck_name: 'Deck B', count: 5 }],
        matchup_data: [
          {
            deck_name: 'My Deck',
            opponent_deck_name: 'Opp Deck',
            total_duels: 20,
            wins: 15,
            win_rate: 0.75,
            win_rate_first: 0.8,
            win_rate_second: 0.7,
          },
        ],
        time_series_data: [],
      },
    };

    // getSharedStatisticsをモックし、sharedStatsDataを設定
    vi.spyOn(sharedStatisticsStore, 'getSharedStatistics').mockImplementation(async () => {
      sharedStatisticsStore.sharedStatsData = mockStatsData;
      sharedStatisticsStore.loading = false;
      return true;
    });

    const wrapper = mount(SharedStatisticsView, {
      global: {
        plugins: [vuetify, pinia],
        stubs: {
          apexchart: true,
          StatCard: true,
          DuelTable: true,
          VNavigationDrawer: true,
          VMain: { template: '<div><slot /></div>' },
          VAppBar: {
            template: '<div class="v-app-bar"><div class="v-toolbar-title"><slot /></div></div>',
          },
          VContainer: { template: '<div><slot /></div>' },
        },
      },
    });

    await flushPromises();
    await wrapper.vm.$nextTick();

    expect(sharedStatisticsStore.getSharedStatistics).toHaveBeenCalledWith(
      'test_share_id',
      currentYear,
      currentMonth,
      expect.objectContaining({
        periodType: 'all',
        rangeStart: 1,
        rangeEnd: 30,
        myDeckId: null,
      }),
    );

    // processedStatsが生成されているか確認
    expect(wrapper.vm.processedStats).not.toBeNull();

    // displayYearとdisplayMonthが設定されているか確認
    expect(wrapper.vm.displayYear).toBe(currentYear);
    expect(wrapper.vm.displayMonth).toBe(currentMonth);
  });

  it('displays error message if shared statistics fetch fails', async () => {
    vi.spyOn(sharedStatisticsStore, 'getSharedStatistics').mockResolvedValue(false);
    sharedStatisticsStore.loading = false;
    sharedStatisticsStore.sharedStatsData = null;

    const wrapper = mount(SharedStatisticsView, {
      global: {
        plugins: [vuetify, pinia],
        stubs: {
          apexchart: true,
          VNavigationDrawer: true,
          VMain: { template: '<div><slot /></div>' },
          VAppBar: {
            template:
              '<div class="v-app-bar"><div class="v-toolbar-title"><slot /></slot></div></div>',
          },
          VContainer: { template: '<div><slot /></div>' },
        },
      },
    });

    await flushPromises();
    await wrapper.vm.$nextTick();

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    expect(sharedStatisticsStore.getSharedStatistics).toHaveBeenCalledWith(
      'test_share_id',
      currentYear,
      currentMonth,
      expect.objectContaining({
        periodType: 'all',
        rangeStart: 1,
        rangeEnd: 30,
        myDeckId: null,
      }),
    );
    expect(wrapper.text()).toContain('共有統計データを読み込めませんでした');
  });

  it('displays loading state', async () => {
    // loadingをtrueに設定してから、getSharedStatisticsをモック
    let resolvePromise: (value: boolean) => void;
    const loadingPromise = new Promise<boolean>((resolve) => {
      resolvePromise = resolve;
    });

    vi.spyOn(sharedStatisticsStore, 'getSharedStatistics').mockImplementation(() => {
      sharedStatisticsStore.loading = true;
      return loadingPromise;
    });

    const wrapper = mount(SharedStatisticsView, {
      global: {
        plugins: [vuetify, pinia],
        stubs: {
          apexchart: true,
          VNavigationDrawer: true,
          VMain: { template: '<div><slot /></div>' },
          VAppBar: {
            template:
              '<div class="v-app-bar"><div class="v-toolbar-title"><slot /></slot></div></div>',
          },
          VContainer: { template: '<div><slot /></div>' },
        },
      },
    });

    // onMountedが実行されるのを待つ
    await wrapper.vm.$nextTick();

    // ローディング状態を確認
    expect(sharedStatisticsStore.loading).toBe(true);

    // ローディングを完了
    sharedStatisticsStore.loading = false;
    resolvePromise!(true);
    await flushPromises();
    await wrapper.vm.$nextTick();

    expect(sharedStatisticsStore.loading).toBe(false);
  });
});
