import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import StatisticsContent from '../StatisticsContent.vue'
import { createTestingPinia } from '@pinia/testing'

// Vuetify セットアップ
const vuetify = createVuetify({
  components,
  directives,
})

describe('StatisticsContent.vue', () => {
  const mockStatistics = {
    monthlyDistribution: {
      series: [10, 20, 30],
      chartOptions: {} as any,
    },
    duels: [],
    myDeckWinRates: [
      {
        deck_name: 'デッキA',
        total_duels: 10,
        wins: 6,
        win_rate: 60,
      },
      {
        deck_name: 'デッキB',
        total_duels: 5,
        wins: 2,
        win_rate: 40,
      },
    ],
    matchupData: [
      {
        deck_name: 'デッキA',
        opponent_deck_name: '相手デッキX',
        total_duels: 5,
        wins: 3,
        win_rate: 60,
        win_rate_first: 70,
        win_rate_second: 50,
      },
      {
        deck_name: 'デッキB',
        opponent_deck_name: '相手デッキY',
        total_duels: 3,
        wins: 1,
        win_rate: 33.3,
        win_rate_first: 50,
        win_rate_second: 20,
      },
    ],
    valueSequence: {
      series: [{ name: 'レート', data: [{ x: '2024-01', y: 1500 }] }],
      chartOptions: {} as any,
    },
  }

  const defaultProps = {
    statistics: mockStatistics,
    gameMode: 'RANK' as const,
    displayMonth: '2024年1月',
    loading: false,
    isShared: false,
  }

  beforeEach(() => {
    // display mock をリセット
    vi.clearAllMocks()
  })

  describe('デスクトップ表示', () => {
    it('smAndDownがfalseの場合、テーブルコンテナが表示される', () => {
      const wrapper = mount(StatisticsContent, {
        props: defaultProps,
        global: {
          plugins: [
            vuetify,
            createTestingPinia({
              createSpy: vi.fn,
            }),
          ],
          mocks: {
            LL: {
              statistics: {
                distribution: {
                  monthlyTitle: () => '月間デッキ分布',
                },
                duelList: {
                  title: () => '月間対戦一覧',
                  totalCount: ({ count }: { count: number }) => `全${count}件`,
                },
                myDeckWinRates: {
                  title: () => '自分のデッキ勝率',
                },
                matchup: {
                  title: () => '相性表',
                  myDeck: () => '自分のデッキ',
                  opponent: () => '相手デッキ',
                  matches: () => '対戦数',
                  winRate: () => '勝率',
                  firstWinRate: () => '先攻勝率',
                  secondWinRate: () => '後攻勝率',
                  noData: () => 'データがありません',
                },
                noData: () => 'データがありません',
              },
              duels: {
                myDeck: () => '自分のデッキ',
              },
            },
          },
          stubs: {
            apexchart: true,
            DuelTable: true,
          },
        },
      })

      // デスクトップではtable-scroll-containerが表示される
      const tableContainers = wrapper.findAll('.table-scroll-container')
      expect(tableContainers.length).toBeGreaterThan(0)

      // アコーディオンは表示されない
      const expansionPanels = wrapper.findAllComponents({ name: 'VExpansionPanels' })
      expect(expansionPanels.length).toBe(0)
    })
  })

  describe('モバイル表示', () => {
    it('smAndDownがtrueの場合、v-expansion-panelsを表示する（自分のデッキ勝率）', async () => {
      // useDisplayをモック
      const useDisplayMock = vi.fn(() => ({
        xs: { value: false },
        smAndDown: { value: true },
      }))

      const wrapper = mount(StatisticsContent, {
        props: defaultProps,
        global: {
          plugins: [
            vuetify,
            createTestingPinia({
              createSpy: vi.fn,
            }),
          ],
          mocks: {
            LL: {
              statistics: {
                distribution: {
                  monthlyTitle: () => '月間デッキ分布',
                },
                duelList: {
                  title: () => '月間対戦一覧',
                  totalCount: ({ count }: { count: number }) => `全${count}件`,
                },
                myDeckWinRates: {
                  title: () => '自分のデッキ勝率',
                },
                matchup: {
                  title: () => '相性表',
                  myDeck: () => '自分のデッキ',
                  opponent: () => '相手デッキ',
                  matches: () => '対戦数',
                  winRate: () => '勝率',
                  firstWinRate: () => '先攻勝率',
                  secondWinRate: () => '後攻勝率',
                  noData: () => 'データがありません',
                },
                noData: () => 'データがありません',
              },
              duels: {
                myDeck: () => '自分のデッキ',
              },
            },
          },
          stubs: {
            apexchart: true,
            DuelTable: true,
          },
        },
      })

      // smAndDownをtrueに設定
      ;(wrapper.vm as any).smAndDown = true
      await wrapper.vm.$nextTick()

      // アコーディオンが表示される
      const expansionPanels = wrapper.findAllComponents({ name: 'VExpansionPanels' })
      expect(expansionPanels.length).toBeGreaterThan(0)

      // デッキ名が表示される
      const panelTitles = wrapper.findAll('.text-subtitle-2')
      expect(panelTitles.length).toBeGreaterThan(0)
      expect(panelTitles[0].text()).toContain('デッキA')
    })

    it('smAndDownがtrueの場合、相性表もアコーディオンで表示する', async () => {
      const wrapper = mount(StatisticsContent, {
        props: defaultProps,
        global: {
          plugins: [
            vuetify,
            createTestingPinia({
              createSpy: vi.fn,
            }),
          ],
          mocks: {
            LL: {
              statistics: {
                distribution: {
                  monthlyTitle: () => '月間デッキ分布',
                },
                duelList: {
                  title: () => '月間対戦一覧',
                  totalCount: ({ count }: { count: number }) => `全${count}件`,
                },
                myDeckWinRates: {
                  title: () => '自分のデッキ勝率',
                },
                matchup: {
                  title: () => '相性表',
                  myDeck: () => '自分のデッキ',
                  opponent: () => '相手デッキ',
                  matches: () => '対戦数',
                  winRate: () => '勝率',
                  firstWinRate: () => '先攻勝率',
                  secondWinRate: () => '後攻勝率',
                  noData: () => 'データがありません',
                },
                noData: () => 'データがありません',
              },
              duels: {
                myDeck: () => '自分のデッキ',
              },
            },
          },
          stubs: {
            apexchart: true,
            DuelTable: true,
          },
        },
      })

      // smAndDownをtrueに設定
      ;(wrapper.vm as any).smAndDown = true
      await wrapper.vm.$nextTick()

      // 相手デッキ名がアコーディオンに表示される
      const vsTexts = wrapper.findAll('.text-caption')
      const vsLabels = vsTexts.filter((el) => el.text().includes('vs'))
      expect(vsLabels.length).toBeGreaterThan(0)
      expect(vsLabels[0].text()).toContain('相手デッキX')
    })
  })

  describe('データが空の場合', () => {
    it('自分のデッキ勝率が空の場合、noDataメッセージを表示する', () => {
      const emptyStats = {
        ...mockStatistics,
        myDeckWinRates: [],
      }

      const wrapper = mount(StatisticsContent, {
        props: {
          ...defaultProps,
          statistics: emptyStats,
        },
        global: {
          plugins: [
            vuetify,
            createTestingPinia({
              createSpy: vi.fn,
            }),
          ],
          mocks: {
            LL: {
              statistics: {
                distribution: {
                  monthlyTitle: () => '月間デッキ分布',
                },
                duelList: {
                  title: () => '月間対戦一覧',
                  totalCount: ({ count }: { count: number }) => `全${count}件`,
                },
                myDeckWinRates: {
                  title: () => '自分のデッキ勝率',
                },
                matchup: {
                  title: () => '相性表',
                  myDeck: () => '自分のデッキ',
                  opponent: () => '相手デッキ',
                  matches: () => '対戦数',
                  winRate: () => '勝率',
                  firstWinRate: () => '先攻勝率',
                  secondWinRate: () => '後攻勝率',
                  noData: () => 'データがありません',
                },
                noData: () => 'データがありません',
              },
              duels: {
                myDeck: () => '自分のデッキ',
              },
            },
          },
          stubs: {
            apexchart: true,
            DuelTable: true,
          },
        },
      })

      const noDataText = wrapper.findAll('.no-data-placeholder')
      expect(noDataText.length).toBeGreaterThan(0)
    })
  })
})
