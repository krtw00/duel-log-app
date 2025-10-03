import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import LoadingOverlay from '../LoadingOverlay.vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { createTestingPinia } from '@pinia/testing'
import { useLoadingStore } from '../../../stores/loading'

const vuetify = createVuetify({
  components,
  directives,
})

describe('LoadingOverlay.vue', () => {
  it('does not render when isLoading is false', () => {
    const wrapper = mount(LoadingOverlay, {
      global: {
        plugins: [vuetify, createTestingPinia({
          initialState: {
            loading: {
              loadingTasks: new Set()
            }
          }
        })],
      },
    })
    const loadingStore = useLoadingStore()
    loadingStore.isLoading = false
    expect(wrapper.find('.loading-overlay').exists()).toBe(false)
  })

  it('renders when isLoading is true', async () => {
    const wrapper = mount(LoadingOverlay, {
      global: {
        plugins: [vuetify, createTestingPinia({
          initialState: {
            loading: {
              loadingTasks: new Set(['test-task'])
            }
          }
        })],
      },
    })
    const loadingStore = useLoadingStore()
    loadingStore.start('test-task')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.loading-overlay').exists()).toBe(true)
    expect(wrapper.find('.loading-text').text()).toBe('読み込み中...')
    expect(wrapper.findComponent({ name: 'VProgressCircular' }).exists()).toBe(true)
  })
})
