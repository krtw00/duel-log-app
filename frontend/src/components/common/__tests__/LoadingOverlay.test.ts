import { describe, it, expect } from 'vitest'
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
    const pinia = createTestingPinia({
      initialState: {
        loading: { loadingTasks: new Set() },
      },
    })

    const wrapper = mount(LoadingOverlay, {
      global: {
        plugins: [vuetify, pinia],
      },
    })

    const overlay = wrapper.findComponent({ name: 'VOverlay' })
    expect(overlay.props('modelValue')).toBe(false)
  })

  it('renders when isLoading is true', () => {
    const pinia = createTestingPinia({
      initialState: {
        loading: { loadingTasks: new Set(['global']) },
      },
    })

    const wrapper = mount(LoadingOverlay, {
      global: {
        plugins: [vuetify, pinia],
      },
    })

    const overlay = wrapper.findComponent({ name: 'VOverlay' })
    expect(overlay.props('modelValue')).toBe(true)
  })
})
