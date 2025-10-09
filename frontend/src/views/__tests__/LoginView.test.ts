import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import LoginView from '../LoginView.vue';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { createTestingPinia } from '@pinia/testing';

const vuetify = createVuetify({
  components,
  directives,
});

// RouterLinkのモック
const RouterLinkStub = {
  template: '<a><slot /></a>',
  props: ['to'],
};

describe('LoginView.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    const wrapper = mount(LoginView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: {
          RouterLink: RouterLinkStub,
        },
      },
    });
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.text()).toContain('DUEL');
  });

  it('displays login form', () => {
    const wrapper = mount(LoginView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: {
          RouterLink: RouterLinkStub,
        },
      },
    });

    expect(wrapper.find('form').exists()).toBe(true);
    expect(wrapper.text()).toContain('ログイン');
  });

  it('has email and password fields', () => {
    const wrapper = mount(LoginView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: {
          RouterLink: RouterLinkStub,
        },
      },
    });

    expect(wrapper.text()).toContain('メールアドレス');
    expect(wrapper.text()).toContain('パスワード');
  });

  it('has login button', () => {
    const wrapper = mount(LoginView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: {
          RouterLink: RouterLinkStub,
        },
      },
    });

    expect(wrapper.find('button[type="submit"]').exists()).toBe(true);
  });

  it('has link to register page', () => {
    const wrapper = mount(LoginView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: {
          RouterLink: RouterLinkStub,
        },
      },
    });

    // "アカウントをお持ちでない方は" のテキストをチェック
    expect(wrapper.text()).toContain('アカウントをお持ちでない方は');
  });
});
