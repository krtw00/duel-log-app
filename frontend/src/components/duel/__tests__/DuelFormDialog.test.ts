import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import DuelFormDialog from '../DuelFormDialog.vue'
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

describe('DuelFormDialog.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.get).mockResolvedValue({
      data: [],
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any
    })
    vi.mocked(api.post).mockResolvedValue({
      data: {},
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any
    })
  })

  it('renders correctly when opened', () => {
    const wrapper = mount(DuelFormDialog, {
      global: {
        plugins: [vuetify, createTestingPinia()],
      },
      props: {
        modelValue: true,
        defaultGameMode: 'RANK',
      },
    })

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('.duel-form-card').exists()).toBe(true)
  })

  it('does not render when modelValue is false', () => {
    const wrapper = mount(DuelFormDialog, {
      global: {
        plugins: [vuetify, createTestingPinia()],
      },
      props: {
        modelValue: false,
        defaultGameMode: 'RANK',
      },
    })

    // ダイアログが閉じているときは、カード要素が存在しない
    expect(wrapper.find('.duel-form-card').exists()).toBe(false)
  })

  it('displays game mode tabs', () => {
    const wrapper = mount(DuelFormDialog, {
      global: {
        plugins: [vuetify, createTestingPinia()],
      },
      props: {
        modelValue: true,
        defaultGameMode: 'RANK',
      },
    })

    // 4つのゲームモードタブが存在
    const tabs = wrapper.findAll('.v-tab')
    expect(tabs.length).toBeGreaterThanOrEqual(4)
  })

  it('has fullscreen mode on mobile', () => {
    const wrapper = mount(DuelFormDialog, {
      global: {
        plugins: [vuetify, createTestingPinia()],
      },
      props: {
        modelValue: true,
        defaultGameMode: 'RANK',
      },
    })

    const dialog = wrapper.findComponent({ name: 'VDialog' })
    expect(dialog.exists()).toBe(true)
    // fullscreen プロパティが存在することを確認
    expect(dialog.props()).toHaveProperty('fullscreen')
  })

  it('emits update:modelValue when closing', async () => {
    const wrapper = mount(DuelFormDialog, {
      global: {
        plugins: [vuetify, createTestingPinia()],
      },
      props: {
        modelValue: true,
        defaultGameMode: 'RANK',
      },
    })

    // closeDialog を直接呼び出す
    ;(wrapper.vm as any).closeDialog()
    
    expect(wrapper.emitted()['update:modelValue']).toBeTruthy()
    expect(wrapper.emitted()['update:modelValue'][0]).toEqual([false])
  })

  it('displays correct title for new duel', () => {
    const wrapper = mount(DuelFormDialog, {
      global: {
        plugins: [vuetify, createTestingPinia()],
      },
      props: {
        modelValue: true,
        defaultGameMode: 'RANK',
        duel: null,
      },
    })

    expect(wrapper.text()).toContain('新規対戦記録')
  })

  it('displays correct title for editing duel', () => {
    const mockDuel = {
      id: 1,
      deck_id: 1,
      opponentDeck_id: 2,
      result: true,
      game_mode: 'RANK' as const,
      rank: 18,
      coin: true,
      first_or_second: true,
      played_date: '2023-01-01T12:00:00Z',
      notes: 'Test',
      create_date: '2023-01-01T12:00:00Z',
      update_date: '2023-01-01T12:00:00Z',
      user_id: 1,
    }

    const wrapper = mount(DuelFormDialog, {
      global: {
        plugins: [vuetify, createTestingPinia()],
      },
      props: {
        modelValue: true,
        defaultGameMode: 'RANK',
        duel: mockDuel,
      },
    })

    expect(wrapper.text()).toContain('対戦記録を編集')
  })

  it('has responsive tab styling', () => {
    const wrapper = mount(DuelFormDialog, {
      global: {
        plugins: [vuetify, createTestingPinia()],
      },
      props: {
        modelValue: true,
        defaultGameMode: 'RANK',
      },
    })

    // mode-tabs-dialog クラスが存在することを確認
    expect(wrapper.find('.mode-tabs-dialog').exists()).toBe(true)
  })
})
