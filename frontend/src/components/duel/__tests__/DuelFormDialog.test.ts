import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import DuelFormDialog from '../DuelFormDialog.vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { createTestingPinia } from '@pinia/testing'
import { useNotificationStore } from '@/stores/notification'
import { api } from '@/services/api'
import { Duel, GameMode } from '@/types'

const vuetify = createVuetify({
  components,
  directives,
})

vi.mock('../../../services/api', () => ({
  api: {
    get: vi.fn(() => Promise.resolve({ data: [] })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
  },
}))

describe('DuelFormDialog.vue', () => {
  let notificationStore: ReturnType<typeof useNotificationStore>

  beforeEach(() => {
    const _pinia = createTestingPinia({
      createSpy: vi.fn,
    })
    notificationStore = useNotificationStore()
    vi.clearAllMocks()
  })

  it('renders correctly in create mode', async () => {
    const wrapper = mount(DuelFormDialog, {
      global: {
        plugins: [vuetify, createTestingPinia()],
      },
      props: {
        modelValue: true,
        duel: null,
      },
    })

    expect(wrapper.find('.v-card-title').text()).toContain('新規対戦記録')
    expect(wrapper.find('button').text()).toContain('登録')
  })

  it('renders correctly in edit mode', async () => {
    const mockDuel: Duel = {
      id: 1,
      deck_id: 1,
      opponentDeck_id: 2,
      result: true,
      game_mode: 'RANK',
      rank: 18,
      coin: true,
      first_or_second: true,
      played_date: '2023-01-01T12:00:00Z',
      notes: 'Test notes',
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
        duel: mockDuel,
      },
    })

    await (wrapper.vm as any).$nextTick()

    expect((wrapper.vm as any).formRef).toBeDefined()
    expect(wrapper.find('.v-card-title').text()).toContain('対戦記録を編集')
    expect(wrapper.find('button').text()).toContain('更新')
  })

  it('emits update:modelValue when dialog is closed', async () => {
    const wrapper = mount(DuelFormDialog, {
      global: {
        plugins: [vuetify, createTestingPinia()],
      },
      props: {
        modelValue: true,
        duel: null,
      },
    })

    wrapper.find('.v-btn').trigger('click') // Cancel button
    await (wrapper.vm as any).$nextTick()

    expect(wrapper.emitted()['update:modelValue']).toBeTruthy()
    expect(wrapper.emitted()['update:modelValue'][0][0]).toBe(false)
  })

  it('calls API to create a duel and emits saved on success', async () => {
    const wrapper = mount(DuelFormDialog, {
      global: {
        plugins: [vuetify, createTestingPinia()],
      },
      props: {
        modelValue: true,
        duel: null,
      },
    })

    // Mock form validation to pass
    ;(wrapper.vm as any).formRef = { validate: () => Promise.resolve({ valid: true }) }

    // Set some form values
    await wrapper.setData({
      form: {
        deck_id: 1,
        opponentDeck_id: 2,
        result: true,
        game_mode: 'RANK',
        rank: 18,
        coin: true,
        first_or_second: true,
        played_date: '2023-01-01T12:00',
        notes: 'Test notes',
      },
    })

    await wrapper.find('button[type="submit"]').trigger('click')
    await (wrapper.vm as any).$nextTick()

    expect(api.post).toHaveBeenCalledWith('/duels/', expect.any(Object))
    expect(notificationStore.success).toHaveBeenCalledWith('対戦記録を登録しました')
    expect(wrapper.emitted().saved).toBeTruthy()
    expect(wrapper.emitted()['update:modelValue'][0][0]).toBe(false)
  })

  it('calls API to update a duel and emits saved on success', async () => {
    const mockDuel: Duel = {
      id: 1,
      deck_id: 1,
      opponentDeck_id: 2,
      result: true,
      game_mode: 'RANK',
      rank: 18,
      coin: true,
      first_or_second: true,
      played_date: '2023-01-01T12:00:00Z',
      notes: 'Test notes',
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
        duel: mockDuel,
      },
    })

    await (wrapper.vm as any).$nextTick()

    // Mock form validation to pass
    ;(wrapper.vm as any).formRef = { validate: () => Promise.resolve({ valid: true }) }

    await wrapper.find('button[type="submit"]').trigger('click')
    await (wrapper.vm as any).$nextTick()

    expect(api.put).toHaveBeenCalledWith('/duels/1', expect.any(Object))
    expect(notificationStore.success).toHaveBeenCalledWith('対戦記録を更新しました')
    expect(wrapper.emitted().saved).toBeTruthy()
    expect(wrapper.emitted()['update:modelValue'][0][0]).toBe(false)
  })
})
