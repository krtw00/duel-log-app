import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import App from './App.vue';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { createTestingPinia } from '@pinia/testing';

const vuetify = createVuetify({
  components,
  directives,
});

describe('App.vue', () => {
  it('renders ToastNotification and LoadingOverlay components', () => {
    const wrapper = mount(App, {
      global: {
        plugins: [vuetify, createTestingPinia()],
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

  it('renders router-view', () => {
    const wrapper = mount(App, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: {
          RouterView: true,
          ToastNotification: true,
          LoadingOverlay: true,
        },
      },
    });
    expect(wrapper.findComponent({ name: 'RouterView' }).exists()).toBe(true);
  });
});
