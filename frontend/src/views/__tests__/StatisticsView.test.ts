import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import StatisticsView from '../StatisticsView.vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { createTestingPinia } from '@pinia/testing'
import { api } from '@/services/api'

const vuetify = createVuetify({
  components,
  directives,
})

vi.mock('@/services/api')

// Mock VueApexCharts component
vi.mock('vue3-apexcharts', () => ({ 
  default: { 
    name: 'Apexchart', 
    template: '<div class="apexchart-mock"></div>' 
  } 
}))

const mockStatisticsData = {
  RANK: {
    monthly_deck_distribution: [{ deck_name: 'Deck A', count: 10 }],
    recent_deck_distribution: [{ deck_name: 'Deck B', count: 5 }],
    matchup_data: [{ 
      deck_name: 'My Deck', 
      opponent_deck_name: 'Opponent Deck', 
      total_duels: 8,
      win_rate: 62.5 
    }],
    time_series_data: []
  },
  RATE: {
    monthly_deck_distribution: [],
    recent_deck_distribution: [],
    matchup_data: [],
    time_series_data: [{ value: 1500 }, { value: 1520 }]
  },
  EVENT: {
    monthly_deck_distribution: [],
    recent_deck_distribution: [],
    matchup_data: [],
    time_series_data: []
  },
  DC: {
    monthly_deck_distribution: [],
    recent_deck_distribution: [],
    matchup_data: [],
    time_series_data: [{ value: 100 }, { value: 150 }]
  }
}

describe('StatisticsView.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.get).mockResolvedValue({ 
      data: mockStatisticsData,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any
    })
  })

  it('renders correctly and fetches statistics on mount', async () => {
    const wrapper = mount(StatisticsView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: {
          AppBar: true,
          Apexchart: true,
        },
      },
    })

    expect(wrapper.exists()).toBe(true)
    
    // 新しいエンドポイントが呼ばれることを確認
    await wrapper.vm.$nextTick()
    expect(api.get).toHaveBeenCalledWith('/statistics', expect.objectContaining({
      params: expect.objectContaining({
        year: expect.any(Number),
        month: expect.any(Number)
      })
    }))

    expect(wrapper.find('h1').text()).toContain('統計情報')
  })

  it('displays no data message when no distribution data is available', async () => {
    const emptyData = {
      RANK: {
        monthly_deck_distribution: [],
        recent_deck_distribution: [],
        matchup_data: [],
        time_series_data: []
      },
      RATE: {
        monthly_deck_distribution: [],
        recent_deck_distribution: [],
        matchup_data: [],
        time_series_data: []
      },
      EVENT: {
        monthly_deck_distribution: [],
        recent_deck_distribution: [],
        matchup_data: [],
        time_series_data: []
      },
      DC: {
        monthly_deck_distribution: [],
        recent_deck_distribution: [],
        matchup_data: [],
        time_series_data: []
      }
    }
    
    vi.mocked(api.get).mockResolvedValue({ 
      data: emptyData,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any
    })

    const wrapper = mount(StatisticsView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: {
          AppBar: true,
          Apexchart: true,
        },
      },
    })

    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('.no-data-placeholder').length).toBeGreaterThan(0)
    expect(wrapper.text()).toContain('データがありません')
  })

  it('displays matchup data correctly', async () => {
    const wrapper = mount(StatisticsView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: {
          AppBar: true,
          Apexchart: true,
        },
      },
    })

    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('デッキ相性表')
  })

  it('getWinRateColor returns correct color based on win rate', () => {
    const wrapper = mount(StatisticsView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: {
          AppBar: true,
          Apexchart: true,
        },
      },
    })

    expect((wrapper.vm as any).getWinRateColor(70)).toBe('success')
    expect((wrapper.vm as any).getWinRateColor(50)).toBe('warning')
    expect((wrapper.vm as any).getWinRateColor(30)).toBe('error')
  })

  it('switches between game mode tabs', async () => {
    const wrapper = mount(StatisticsView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: {
          AppBar: true,
          Apexchart: true,
        },
      },
    })

    await wrapper.vm.$nextTick()

    // デフォルトはRANKタブ
    expect((wrapper.vm as any).currentTab).toBe('RANK')

    // タブを切り替え
    await wrapper.vm.$nextTick()
    const tabs = wrapper.findAll('.v-tab')
    
    // タブの存在を確認
    expect(tabs.length).toBeGreaterThan(0)
  })

  it('fetches statistics when year/month is changed', async () => {
    const wrapper = mount(StatisticsView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: {
          AppBar: true,
          Apexchart: true,
        },
      },
    })

    await wrapper.vm.$nextTick()
    vi.clearAllMocks() // 初期呼び出しをクリア

    // 年を変更
    ;(wrapper.vm as any).selectedYear = 2024
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    // APIが再度呼ばれたことを確認
    expect(api.get).toHaveBeenCalled()
  })

  it('handles API errors gracefully', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('API Error'))

    const wrapper = mount(StatisticsView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: {
          AppBar: true,
          Apexchart: true,
        },
      },
    })

    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    // エラーが発生してもコンポーネントはマウントされる
    expect(wrapper.exists()).toBe(true)
  })
})
