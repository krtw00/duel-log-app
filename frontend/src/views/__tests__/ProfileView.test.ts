import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import ProfileView from '../ProfileView.vue';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { createTestingPinia } from '@pinia/testing';
import { useAuthStore } from '@/stores/auth';

const vuetify = createVuetify({
  components,
  directives,
});

vi.mock('@/services/api');

describe('ProfileView.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    const pinia = createTestingPinia();
    const authStore = useAuthStore(pinia);
    authStore.user = {
      id: 'test-user-uuid',
      email: 'test@example.com',
      username: 'testuser',
      streamer_mode: false,
      theme_preference: 'dark',
      is_admin: false,
      enable_screen_analysis: false,
    };

    const wrapper = mount(ProfileView, {
      global: {
        plugins: [vuetify, pinia],
        stubs: {
          AppBar: true,
          VNavigationDrawer: true,
          VMain: { template: '<div><slot /></div>' },
          VContainer: { template: '<div><slot /></div>' },
        },
      },
    });

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.text()).toContain('プロフィール');
  });

  it('displays user information in form', () => {
    const pinia = createTestingPinia();
    const authStore = useAuthStore(pinia);
    authStore.user = {
      id: 'test-user-uuid',
      email: 'test@example.com',
      username: 'testuser',
      streamer_mode: false,
      theme_preference: 'dark',
      is_admin: false,
      enable_screen_analysis: false,
    };

    const wrapper = mount(ProfileView, {
      global: {
        plugins: [vuetify, pinia],
        stubs: {
          AppBar: true,
          VNavigationDrawer: true,
          VMain: { template: '<div><slot /></div>' },
          VContainer: { template: '<div><slot /></div>' },
        },
      },
    });

    // フォームフィールドのラベルが存在することを確認
    expect(wrapper.text()).toContain('ユーザー名');
    expect(wrapper.text()).toContain('メールアドレス');
  });

  it('has streamer mode toggle', () => {
    const pinia = createTestingPinia();
    const authStore = useAuthStore(pinia);
    authStore.user = {
      id: 'test-user-uuid',
      email: 'test@example.com',
      username: 'testuser',
      streamer_mode: false,
      theme_preference: 'dark',
      is_admin: false,
      enable_screen_analysis: false,
    };

    const wrapper = mount(ProfileView, {
      global: {
        plugins: [vuetify, pinia],
        stubs: {
          AppBar: true,
          VNavigationDrawer: true,
          VMain: { template: '<div><slot /></div>' },
          VContainer: { template: '<div><slot /></div>' },
        },
      },
    });

    expect(wrapper.text()).toContain('配信者モード');
  });
});
