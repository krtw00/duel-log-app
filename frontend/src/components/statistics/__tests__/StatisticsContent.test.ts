import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { createTestingPinia } from '@pinia/testing';
import StatisticsContent from '../StatisticsContent.vue';

const vuetify = createVuetify({ components, directives });

describe('StatisticsContent.vue', () => {
  it('colors matchup win rates (advantage=red, disadvantage=blue)', async () => {
    const wrapper = mount(StatisticsContent, {
      global: {
        plugins: [vuetify, createTestingPinia({ createSpy: vi.fn })],
        stubs: {
          apexchart: true,
          DuelTable: true,
        },
      },
      props: {
        statistics: {
          monthlyDistribution: { series: [], chartOptions: {} as any },
          duels: [],
          myDeckWinRates: [
            {
              deck_name: 'MyDeck',
              total_duels: 20,
              wins: 12,
              win_rate: 60,
            },
            {
              deck_name: 'MyDeck2',
              total_duels: 10,
              wins: 4,
              win_rate: 40,
            },
          ],
          matchupData: [
            {
              deck_name: 'A',
              opponent_deck_name: 'B',
              total_duels: 10,
              wins: 6,
              win_rate: 60,
              win_rate_first: 70,
              win_rate_second: 40,
            },
            {
              deck_name: 'C',
              opponent_deck_name: 'D',
              total_duels: 10,
              wins: 5,
              win_rate: 50,
              win_rate_first: 50,
              win_rate_second: 50,
            },
          ],
          valueSequence: { series: [], chartOptions: {} as any },
        },
        gameMode: 'RANK',
        displayMonth: '2026年1月',
        loading: false,
      },
    });

    await wrapper.vm.$nextTick();

    const chips = wrapper.findAllComponents({ name: 'VChip' });
    const percentChips = chips.filter((chip) => chip.text().includes('%'));

    const winRateChip = percentChips.find((chip) => chip.text().includes('60.0%'));
    expect(winRateChip?.props('color')).toBe('error');

    const firstChip = percentChips.find((chip) => chip.text().includes('70.0%'));
    expect(firstChip?.props('color')).toBe('error');

    const secondChip = percentChips.find((chip) => chip.text().includes('40.0%'));
    expect(secondChip?.props('color')).toBe('info');

    const neutralChip = percentChips.find((chip) => chip.text().includes('50.0%'));
    expect(neutralChip?.props('color')).toBeUndefined();

    const myDeckChip = percentChips.find((chip) => chip.text().includes('12 / 20'));
    expect(myDeckChip?.props('color')).toBe('error');

    const myDeckChip2 = percentChips.find((chip) => chip.text().includes('4 / 10'));
    expect(myDeckChip2?.props('color')).toBe('info');
  });
});
