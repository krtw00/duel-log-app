import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import DashboardHeader from '../DashboardHeader.vue';

const vuetify = createVuetify({ components, directives });

describe('DashboardHeader.vue', () => {
  const defaultProps = {
    gameMode: 'RANK' as const,
    year: 2024,
    month: 10,
    rankCount: 10,
    rateCount: 5,
    eventCount: 2,
    dcCount: 8,
  };

  it('renders tabs and date filters with correct initial values', () => {
    const wrapper = mount(DashboardHeader, {
      props: defaultProps,
      global: {
        plugins: [vuetify],
      },
    });

    // Check if GameModeTabBar is rendered with correct counts
    const gameModeTabBar = wrapper.findComponent({ name: 'GameModeTabBar' });
    expect(gameModeTabBar.exists()).toBe(true);
    expect(gameModeTabBar.props('rankCount')).toBe(10);
    expect(gameModeTabBar.props('rateCount')).toBe(5);

    // Check if DateFilterBar is rendered with correct year and month
    const dateFilterBar = wrapper.findComponent({ name: 'DateFilterBar' });
    expect(dateFilterBar.exists()).toBe(true);
    expect(dateFilterBar.props('year')).toBe(2024);
    expect(dateFilterBar.props('month')).toBe(10);
  });

  it('emits update:gameMode when game mode tab is changed', async () => {
    const wrapper = mount(DashboardHeader, {
      props: defaultProps,
      global: {
        plugins: [vuetify],
      },
    });

    const gameModeTabBar = wrapper.findComponent({ name: 'GameModeTabBar' });
    await gameModeTabBar.vm.$emit('update:modelValue', 'RATE');

    expect(wrapper.emitted('update:gameMode')).toBeTruthy();
    expect(wrapper.emitted('update:gameMode')![0]).toEqual(['RATE']);
  });

  it('emits update:year when year is changed', async () => {
    const wrapper = mount(DashboardHeader, {
      props: defaultProps,
      global: {
        plugins: [vuetify],
      },
    });

    const dateFilterBar = wrapper.findComponent({ name: 'DateFilterBar' });
    await dateFilterBar.vm.$emit('update:year', 2023);

    expect(wrapper.emitted('update:year')).toBeTruthy();
    expect(wrapper.emitted('update:year')![0]).toEqual([2023]);
  });

  it('emits update:month when month is changed', async () => {
    const wrapper = mount(DashboardHeader, {
      props: defaultProps,
      global: {
        plugins: [vuetify],
      },
    });

    const dateFilterBar = wrapper.findComponent({ name: 'DateFilterBar' });
    await dateFilterBar.vm.$emit('update:month', 11);

    expect(wrapper.emitted('update:month')).toBeTruthy();
    expect(wrapper.emitted('update:month')![0]).toEqual([11]);
  });
});
