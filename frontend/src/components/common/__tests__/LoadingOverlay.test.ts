import { describe, it, expect, vi as _vi } from 'vitest'
import { mount } from '@vue/test-utils'
import LoadingOverlay from '../LoadingOverlay.vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { createTestingPinia } from '@pinia/testing'
import { useLoadingStore } from '@/stores/loading'

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
    expect(loadingStore.isLoading).toBe(false)
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
    // The initialState already sets isLoading to true, so no need to call start here
    expect(loadingStore.isLoading).toBe(true)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.loading-overlay').exists()).toBe(true)
    expect(wrapper.find('.loading-text').text()).toBe('読み込み中...')
    expect(wrapper.findComponent({ name: 'VProgressCircular' }).exists()).toBe(true)
  })
})
