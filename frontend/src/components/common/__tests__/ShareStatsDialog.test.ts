import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { createTestingPinia } from '@pinia/testing'
import ShareStatsDialog from '../ShareStatsDialog.vue'
import { useSharedStatisticsStore } from '../../../stores/shared_statistics'
import { useNotificationStore } from '../../../stores/notification'

const vuetify = createVuetify({
  components,
  directives,
})

describe('ShareStatsDialog.vue', () => {
  let sharedStatisticsStore: ReturnType<typeof useSharedStatisticsStore>
  let notificationStore: ReturnType<typeof useNotificationStore>

  beforeEach(() => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
    })
    sharedStatisticsStore = useSharedStatisticsStore()
    notificationStore = useNotificationStore()
    vi.clearAllMocks()
  })

  it('renders correctly and is hidden by default', () => {
    const wrapper = mount(ShareStatsDialog, {
      global: {
        plugins: [vuetify, createTestingPinia()],
      },
      props: {
        modelValue: false,
        initialYear: 2023,
        initialMonth: 10,
        initialGameMode: 'RANK',
      },
    })

    expect(wrapper.find('.v-card-title').text()).toBe('共有リンクを生成')
    expect(wrapper.find('.v-dialog').exists()).toBe(false) // Dialog should be hidden
  })

  it('opens when modelValue is true', async () => {
    const wrapper = mount(ShareStatsDialog, {
      global: {
        plugins: [vuetify, createTestingPinia()],
      },
      props: {
        modelValue: true,
        initialYear: 2023,
        initialMonth: 10,
        initialGameMode: 'RANK',
      },
    })

    await wrapper.vm.$nextTick() // Wait for dialog to open
    expect(wrapper.find('.v-dialog').exists()).toBe(true)
  })

  it('generates a link successfully with no expiration', async () => {
    const mockShareId = 'generated_share_id_123'
    sharedStatisticsStore.createSharedLink.mockResolvedValue(mockShareId)

    const wrapper = mount(ShareStatsDialog, {
      global: {
        plugins: [vuetify, createTestingPinia()],
      },
      props: {
        modelValue: true,
        initialYear: 2023,
        initialMonth: 10,
        initialGameMode: 'RANK',
      },
    })

    await wrapper.vm.$nextTick()

    wrapper.vm.selectedYear = 2023
    wrapper.vm.selectedMonth = 10
    wrapper.vm.selectedGameMode = 'RANK'
    wrapper.vm.expiresAt = '' // No expiration

    await wrapper.find('form').trigger('submit')

    expect(sharedStatisticsStore.createSharedLink).toHaveBeenCalledWith({
      year: 2023,
      month: 10,
      game_mode: 'RANK',
      expires_at: undefined,
    })
    expect(wrapper.vm.generatedLink).toContain(mockShareId)
    expect(notificationStore.success).toHaveBeenCalledWith('共有リンクをクリップボードにコピーしました！')
  })

  it('generates a link successfully with YYYY-MM-DD expiration', async () => {
    const mockShareId = 'generated_share_id_456'
    sharedStatisticsStore.createSharedLink.mockResolvedValue(mockShareId)

    const wrapper = mount(ShareStatsDialog, {
      global: {
        plugins: [vuetify, createTestingPinia()],
      },
      props: {
        modelValue: true,
        initialYear: 2023,
        initialMonth: 10,
        initialGameMode: 'RANK',
      },
    })

    await wrapper.vm.$nextTick()

    wrapper.vm.selectedYear = 2023
    wrapper.vm.selectedMonth = 10
    wrapper.vm.selectedGameMode = 'RANK'
    wrapper.vm.expiresAt = '2025-12-31'

    await wrapper.find('form').trigger('submit')

    expect(sharedStatisticsStore.createSharedLink).toHaveBeenCalledWith({
      year: 2023,
      month: 10,
      game_mode: 'RANK',
      expires_at: '2025-12-31T00:00:00.000Z', // Midnight UTC
    })
    expect(wrapper.vm.generatedLink).toContain(mockShareId)
    expect(notificationStore.success).toHaveBeenCalledWith('共有リンクをクリップボードにコピーしました！')
  })

  it('shows error for invalid YYYY-MM-DD format', async () => {
    const wrapper = mount(ShareStatsDialog, {
      global: {
        plugins: [vuetify, createTestingPinia()],
      },
      props: {
        modelValue: true,
        initialYear: 2023,
        initialMonth: 10,
        initialGameMode: 'RANK',
      },
    })

    await wrapper.vm.$nextTick()

    wrapper.vm.expiresAt = 'invalid-date-format'
    await wrapper.find('form').trigger('submit')

    expect(sharedStatisticsStore.createSharedLink).not.toHaveBeenCalled()
    expect(notificationStore.error).toHaveBeenCalledWith('有効期限の日付形式が不正です。YYYY-MM-DD 形式で入力してください。')
  })

  it('shows error for non-existent date (e.g., 2025-02-30)', async () => {
    const wrapper = mount(ShareStatsDialog, {
      global: {
        plugins: [vuetify, createTestingPinia()],
      },
      props: {
        modelValue: true,
        initialYear: 2023,
        initialMonth: 10,
        initialGameMode: 'RANK',
      },
    })

    await wrapper.vm.$nextTick()

    wrapper.vm.expiresAt = '2025-02-30' // February 30th does not exist
    await wrapper.find('form').trigger('submit')

    expect(sharedStatisticsStore.createSharedLink).not.toHaveBeenCalled()
    expect(notificationStore.error).toHaveBeenCalledWith('有効期限の日付が不正です。存在しない日付が入力されました。')
  })

  it('resets generated link and expiration on dialog close', async () => {
    const wrapper = mount(ShareStatsDialog, {
      global: {
        plugins: [vuetify, createTestingPinia()],
      },
      props: {
        modelValue: true,
        initialYear: 2023,
        initialMonth: 10,
        initialGameMode: 'RANK',
      },
    })

    await wrapper.vm.$nextTick()
    wrapper.vm.generatedLink = 'http://test.com/share/abc'
    wrapper.vm.expiresAt = '2023-11-01'

    await wrapper.setProps({ modelValue: false })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.generatedLink).toBe('')
    expect(wrapper.vm.expiresAt).toBe('')
  })
})