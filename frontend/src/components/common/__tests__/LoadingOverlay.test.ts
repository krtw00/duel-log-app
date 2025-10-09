import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import LoadingOverlay from '../LoadingOverlay.vue';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { setActivePinia, createPinia } from 'pinia';
import { useLoadingStore } from '@/stores/loading';

const vuetify = createVuetify({
  components,
  directives,
});

describe('LoadingOverlay.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('does not render when isLoading is false', () => {
    const wrapper = mount(LoadingOverlay, {
      global: {
        plugins: [vuetify],
      },
    });

    const overlay = wrapper.findComponent({ name: 'VOverlay' });
    expect(overlay.exists()).toBe(true);
    expect(overlay.props('modelValue')).toBe(false);
  });

  it('renders when isLoading is true', () => {
    const loadingStore = useLoadingStore();
    loadingStore.start('test-loading');

    const wrapper = mount(LoadingOverlay, {
      global: {
        plugins: [vuetify],
      },
    });

    const overlay = wrapper.findComponent({ name: 'VOverlay' });
    expect(overlay.exists()).toBe(true);
    expect(overlay.props('modelValue')).toBe(true);

    // クリーンアップ
    loadingStore.stop('test-loading');
  });
});
