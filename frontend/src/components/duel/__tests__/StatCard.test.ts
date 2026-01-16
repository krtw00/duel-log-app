import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import StatCard from '../StatCard.vue';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

const vuetify = createVuetify({
  components,
  directives,
});

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
    });

    expect(wrapper.find('.stat-card__title').text()).toBe('Total Duels');
    expect(wrapper.find('.stat-card__value').text()).toBe('100');
    expect(wrapper.find('.v-icon').classes()).toContain('mdi-sword-cross');
    expect(wrapper.classes()).toContain('stat-card--primary');
  });

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
    });

    expect(wrapper.find('.stat-card__title').text()).toBe('Win Rate');
    expect(wrapper.find('.stat-card__value').text()).toBe('65.5%');
    expect(wrapper.find('.v-icon').classes()).toContain('mdi-trophy');
    expect(wrapper.classes()).toContain('stat-card--success');
  });

  it('has proper responsive styling classes', () => {
    const wrapper = mount(StatCard, {
      global: {
        plugins: [vuetify],
      },
      props: {
        title: 'Test Card',
        value: 50,
        icon: 'mdi-test',
        color: 'primary',
      },
    });

    // 基本クラスの確認
    expect(wrapper.find('.stat-card__title').exists()).toBe(true);
    expect(wrapper.find('.stat-card__value').exists()).toBe(true);
    expect(wrapper.find('.stat-card__icon-wrapper').exists()).toBe(true);
  });

  it('displays icon with correct size', () => {
    const wrapper = mount(StatCard, {
      global: {
        plugins: [vuetify],
      },
      props: {
        title: 'Test',
        value: 10,
        icon: 'mdi-chart-bar',
        color: 'info',
      },
    });

    const icon = wrapper.findComponent({ name: 'VIcon' });
    expect(icon.exists()).toBe(true);
    // sizeは数値型で渡される
    expect(icon.props('size')).toBe(40);
  });
});
