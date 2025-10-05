import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import RegisterView from '../RegisterView.vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { createTestingPinia } from '@pinia/testing'

const vuetify = createVuetify({
  components,
  directives,
})

// RouterLinkのモック
const RouterLinkStub = {
  template: '<a><slot /></a>',
  props: ['to']
}

describe('RegisterView.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders correctly', () => {
    const wrapper = mount(RegisterView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: {
          RouterLink: RouterLinkStub
        },
      },
    })

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.text()).toContain('DUEL')
  })

  it('displays registration form', () => {
    const wrapper = mount(RegisterView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: {
          RouterLink: RouterLinkStub
        },
      },
    })

    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.text()).toContain('Create Your Account')
  })

  it('has username, email and password fields', () => {
    const wrapper = mount(RegisterView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: {
          RouterLink: RouterLinkStub
        },
      },
    })

    expect(wrapper.text()).toContain('ユーザー名')
    expect(wrapper.text()).toContain('メールアドレス')
    expect(wrapper.text()).toContain('パスワード')
  })

  it('has register button', () => {
    const wrapper = mount(RegisterView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: {
          RouterLink: RouterLinkStub
        },
      },
    })

    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
  })

  it('has link to login page', () => {
    const wrapper = mount(RegisterView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: {
          RouterLink: RouterLinkStub
        },
      },
    })

    // "アカウントをお持ちでない方は" のテキストをチェック
    expect(wrapper.text()).toContain('アカウントをお持ちでない方は')
  })
})
