import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import InlineLoader from '../InlineLoader.vue';

const vuetify = createVuetify({
  components,
  directives,
});

describe('InlineLoader', () => {
  it('should render when visible is true', () => {
    const wrapper = mount(InlineLoader, {
      global: {
        plugins: [vuetify],
      },
      props: {
        visible: true,
      },
    });

    expect(wrapper.find('.inline-loader').exists()).toBe(true);
  });

  it('should not render when visible is false', () => {
    const wrapper = mount(InlineLoader, {
      global: {
        plugins: [vuetify],
      },
      props: {
        visible: false,
      },
    });

    expect(wrapper.find('.inline-loader').exists()).toBe(false);
  });

  it('should render with text', () => {
    const wrapper = mount(InlineLoader, {
      global: {
        plugins: [vuetify],
      },
      props: {
        visible: true,
        text: 'Loading...',
      },
    });

    expect(wrapper.text()).toContain('Loading...');
  });

  it('should not render text when text prop is not provided', () => {
    const wrapper = mount(InlineLoader, {
      global: {
        plugins: [vuetify],
      },
      props: {
        visible: true,
      },
    });

    expect(wrapper.find('.inline-loader__text').exists()).toBe(false);
  });

  it('should apply small size class', () => {
    const wrapper = mount(InlineLoader, {
      global: {
        plugins: [vuetify],
      },
      props: {
        visible: true,
        size: 'small',
      },
    });

    expect(wrapper.find('.inline-loader--small').exists()).toBe(true);
  });

  it('should apply medium size class by default', () => {
    const wrapper = mount(InlineLoader, {
      global: {
        plugins: [vuetify],
      },
      props: {
        visible: true,
      },
    });

    expect(wrapper.find('.inline-loader--medium').exists()).toBe(true);
  });

  it('should apply large size class', () => {
    const wrapper = mount(InlineLoader, {
      global: {
        plugins: [vuetify],
      },
      props: {
        visible: true,
        size: 'large',
      },
    });

    expect(wrapper.find('.inline-loader--large').exists()).toBe(true);
  });

  it('should pass color prop to v-progress-circular', () => {
    const wrapper = mount(InlineLoader, {
      global: {
        plugins: [vuetify],
      },
      props: {
        visible: true,
        color: 'error',
      },
    });

    const progressCircular = wrapper.findComponent({ name: 'VProgressCircular' });
    expect(progressCircular.exists()).toBe(true);
    expect(progressCircular.props('color')).toBe('error');
  });

  it('should use primary color by default', () => {
    const wrapper = mount(InlineLoader, {
      global: {
        plugins: [vuetify],
      },
      props: {
        visible: true,
      },
    });

    const progressCircular = wrapper.findComponent({ name: 'VProgressCircular' });
    expect(progressCircular.props('color')).toBe('primary');
  });
});
