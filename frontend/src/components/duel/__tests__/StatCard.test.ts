import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StatCard from '../StatCard.vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const vuetify = createVuetify({
  components,
  directives,
})

describe('StatCard.vue', () => {
  it('renders props correctly', () => {
    const wrapper = mount(StatCard, {
      global: {
        plugins: [vuetify],
      },
      props: {
        title: 'Total Duels',
        value: 100,
        icon: 'mdi-sword-cross',
        color: 'primary',
      },
    })

    expect(wrapper.find('.stat-card__title').text()).toBe('Total Duels')
    expect(wrapper.find('.stat-card__value').text()).toBe('100')
    expect(wrapper.find('.v-icon').classes()).toContain('mdi-sword-cross')
    expect(wrapper.classes()).toContain('stat-card--primary')
  })

  it('renders different values and colors', () => {
    const wrapper = mount(StatCard, {
      global: {
        plugins: [vuetify],
      },
      props: {
        title: 'Win Rate',
        value: '65.5%',
        icon: 'mdi-trophy',
        color: 'success',
      },
    })

    expect(wrapper.find('.stat-card__title').text()).toBe('Win Rate')
    expect(wrapper.find('.stat-card__value').text()).toBe('65.5%')
    expect(wrapper.find('.v-icon').classes()).toContain('mdi-trophy')
    expect(wrapper.classes()).toContain('stat-card--success')
  })
})
