import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import App from './App.vue';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { createTestingPinia } from '@pinia/testing';

// Mock vue-router partially
vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>();
  return {
    ...actual,
    useRoute: () => ({
      path: '/',
      name: 'home',
      params: {},
      query: {},
    }),
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
    }),
  };
});

const vuetify = createVuetify({
  components,
  directives,
});

describe('App.vue', () => {
  it('renders ToastNotification and LoadingOverlay components', () => {
    const wrapper = mount(App, {
      global: {
        plugins: [
          vuetify,
          createTestingPinia({
            initialState: {
              auth: { isInitialized: true },
            },
          }),
        ],
        stubs: {
          RouterView: true,
          ToastNotification: true,
          LoadingOverlay: true,
        },
      },
    });

    expect(wrapper.findComponent({ name: 'ToastNotification' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'LoadingOverlay' }).exists()).toBe(true);
  });

  it('renders router-view when auth is initialized', () => {
    const wrapper = mount(App, {
      global: {
        plugins: [
          vuetify,
          createTestingPinia({
            initialState: {
              auth: { isInitialized: true },
            },
          }),
        ],
        stubs: {
          RouterView: true,
          ToastNotification: true,
          LoadingOverlay: true,
        },
      },
    });
    expect(wrapper.findComponent({ name: 'RouterView' }).exists()).toBe(true);
  });

  it('shows loading state when auth is not initialized', () => {
    const wrapper = mount(App, {
      global: {
        plugins: [
          vuetify,
          createTestingPinia({
            initialState: {
              auth: { isInitialized: false },
            },
          }),
        ],
        stubs: {
          RouterView: true,
          ToastNotification: true,
          LoadingOverlay: true,
        },
      },
    });
    // router-view should not be rendered when not initialized
    expect(wrapper.findComponent({ name: 'RouterView' }).exists()).toBe(false);
    // Loading indicator should be shown
    expect(wrapper.find('.v-progress-circular').exists()).toBe(true);
  });
});
