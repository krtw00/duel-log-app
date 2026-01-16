<template>
  <v-row>
    <!-- 月間デッキ分布 -->
    <v-col cols="12" lg="6">
      <v-card :class="statsCardClass">
        <v-card-title>{{ LL?.statistics.distribution.monthlyTitle() }} ({{ displayMonth }})</v-card-title>
        <v-card-text>
          <apexchart
            v-if="
              statistics.monthlyDistribution &&
              statistics.monthlyDistribution.series &&
              statistics.monthlyDistribution.series.length > 0
            "
            type="pie"
            :height="chartHeight"
            :options="statistics.monthlyDistribution.chartOptions"
            :series="statistics.monthlyDistribution.series"
          ></apexchart>
          <div v-else class="no-data-placeholder">
            <v-icon size="64" color="grey">mdi-chart-pie</v-icon>
            <p class="text-body-1 text-grey mt-4">{{ LL?.statistics.noData() }}</p>
          </div>
        </v-card-text>
      </v-card>
    </v-col>

    <!-- 月間対戦一覧 -->
    <v-col cols="12" lg="6">
      <v-card :class="statsCardClass">
        <v-card-title class="d-flex align-center justify-space-between">
          <span>{{ LL?.statistics.duelList.title() }} ({{ displayMonth }})</span>
          <v-chip size="small" variant="outlined">
            {{ LL?.statistics.duelList.totalCount({ count: (statistics.duels || []).length }) }}
          </v-chip>
        </v-card-title>
        <v-card-text class="pa-0 pa-sm-4">
          <div class="table-scroll-container">
            <duel-table
              :duels="statistics.duels || []"
              :loading="loading"
              :show-actions="!isShared"
              :hidden-columns="isShared ? ['actions'] : []"
              table-height="480px"
            />
          </div>
        </v-card-text>
      </v-card>
    </v-col>

    <!-- 自分のデッキ勝率 -->
    <v-col cols="12">
      <v-card :class="statsCardClass">
        <v-card-title>{{ LL?.statistics.myDeckWinRates.title() }}</v-card-title>
        <v-card-text class="pa-0 pa-sm-4">
          <div class="table-scroll-container">
            <v-data-table
              :headers="myDeckWinRatesHeaders"
              :items="statistics.myDeckWinRates || []"
              :loading="loading"
              class="matchup-table"
              density="compact"
            >
              <template #item.win_rate="{ item }">
                <v-chip
                  size="small"
                  :color="getMatchupColor(item.win_rate)"
                  :variant="getMatchupColor(item.win_rate) ? 'tonal' : 'outlined'"
                >
                  {{ item.wins }} / {{ item.total_duels }} ({{ formatPercent(item.win_rate) }})
                </v-chip>
              </template>
              <template #no-data>
                <div class="no-data-placeholder py-8">
                  <v-icon size="64" color="grey">mdi-chart-bar</v-icon>
                  <p class="text-body-1 text-grey mt-4">{{ LL?.statistics.noData() }}</p>
                </div>
              </template>
            </v-data-table>
          </div>
        </v-card-text>
      </v-card>
    </v-col>

    <!-- 相性表 -->
    <v-col cols="12">
      <v-card :class="statsCardClass">
        <v-card-title>{{ LL?.statistics.matchup.title() }}</v-card-title>
        <v-card-text class="pa-0 pa-sm-4">
          <div class="table-scroll-container">
            <v-data-table
              :headers="matchupHeaders"
              :items="statistics.matchupData || []"
              :loading="loading"
              class="matchup-table"
              density="compact"
            >
            <template #item.win_rate="{ item }">
              <v-chip
                size="small"
                :color="getMatchupColor(item.win_rate)"
                :variant="getMatchupColor(item.win_rate) ? 'tonal' : 'outlined'"
              >
                {{ item.wins }} / {{ item.total_duels }} ({{ formatPercent(item.win_rate) }})
              </v-chip>
            </template>
            <template #item.win_rate_first="{ item }">
              <v-chip
                size="small"
                :color="getMatchupColor(item.win_rate_first)"
                :variant="getMatchupColor(item.win_rate_first) ? 'tonal' : 'outlined'"
              >
                {{ formatPercent(item.win_rate_first) }}
              </v-chip>
            </template>
            <template #item.win_rate_second="{ item }">
              <v-chip
                size="small"
                :color="getMatchupColor(item.win_rate_second)"
                :variant="getMatchupColor(item.win_rate_second) ? 'tonal' : 'outlined'"
              >
                {{ formatPercent(item.win_rate_second) }}
              </v-chip>
            </template>
            <template #no-data>
              <div class="no-data-placeholder py-8">
                <v-icon size="64" color="grey">mdi-table-off</v-icon>
                <p class="text-body-1 text-grey mt-4">{{ LL?.statistics.matchup.noData() }}</p>
              </div>
            </template>
            </v-data-table>
          </div>
        </v-card-text>
      </v-card>
    </v-col>

    <!-- レート/DC変動グラフ (RATEとDCタブのみ) -->
    <v-col v-if="gameMode === 'RATE' || gameMode === 'DC'" cols="12">
      <v-card :class="statsCardClass">
        <v-card-title>
          {{ gameMode === 'RATE' ? LL?.statistics.rateChart.title() : LL?.statistics.dcChart.title() }} ({{ displayMonth }})
        </v-card-title>
        <v-card-text class="pa-0 pa-sm-4">
          <div class="chart-scroll-container">
            <div class="chart-inner">
              <apexchart
                v-if="
                  statistics.valueSequence &&
                  statistics.valueSequence.series &&
                  statistics.valueSequence.series[0] &&
                  statistics.valueSequence.series[0].data &&
                  statistics.valueSequence.series[0].data.length > 0
                "
                type="line"
                :height="chartHeight"
                :options="statistics.valueSequence.chartOptions"
                :series="statistics.valueSequence.series"
              ></apexchart>
              <div v-else class="no-data-placeholder">
                <v-icon size="64" color="grey">{{
                  gameMode === 'RATE' ? 'mdi-chart-line' : 'mdi-trophy-variant'
                }}</v-icon>
                <p class="text-body-1 text-grey mt-4">{{ LL?.statistics.noData() }}</p>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDisplay } from 'vuetify';
import { useThemeStore } from '@/stores/theme';
import { useLocale } from '@/composables/useLocale';
import DuelTable from '@/components/duel/DuelTable.vue';
import type { Duel, MatchupData } from '@/types';
import type { ApexPieChartOptions, ApexLineChartOptions, ApexLineChartSeries } from '@/types/chart';

const { LL } = useLocale();
const { xs, smAndDown } = useDisplay();

// モバイル用チャート高さ
const chartHeight = computed(() => {
  if (xs.value) return 250;
  if (smAndDown.value) return 300;
  return 350;
});

/**
 * 自分のデッキ勝率データ
 */
interface MyDeckWinRate {
  deck_name: string;
  total_duels: number;
  wins: number;
  win_rate: number;
}

/**
 * 月間デッキ分布データ（チャート用）
 */
interface MonthlyDistribution {
  series: number[];
  chartOptions: ApexPieChartOptions;
}

/**
 * 値シーケンスデータ（チャート用）
 */
interface ValueSequence {
  series: ApexLineChartSeries[];
  chartOptions: ApexLineChartOptions;
}

/**
 * 統計データのインターフェース
 */
interface StatisticsData {
  monthlyDistribution?: MonthlyDistribution;
  duels?: Duel[];
  myDeckWinRates?: MyDeckWinRate[];
  matchupData?: MatchupData[];
  valueSequence?: ValueSequence;
}

interface Props {
  statistics: StatisticsData;
  gameMode: 'RANK' | 'RATE' | 'EVENT' | 'DC';
  displayMonth: string;
  loading?: boolean;
  isShared?: boolean;
}

withDefaults(defineProps<Props>(), {
  loading: false,
  isShared: false,
});

const themeStore = useThemeStore();

const normalizePercent = (value: number) => {
  if (!Number.isFinite(value)) return 0;
  // Some APIs might send ratios (0-1). Convert to percent for consistent UI.
  return value <= 1 ? value * 100 : value;
};

const formatPercent = (value: number) => `${normalizePercent(value).toFixed(1)}%`;

// 優勢: 青 / 劣勢: 赤（ユーザー要望により色相を反転）
const getMatchupColor = (value: number) => {
  const percent = normalizePercent(value);
  if (percent >= 55) return 'info';
  if (percent <= 45) return 'error';
  return undefined;
};

const statsCardClass = computed(() => [
  'stats-card',
  themeStore.isDark ? 'stats-card--dark' : 'stats-card--light',
]);

const myDeckWinRatesHeaders = computed(() => [
  { title: LL.value?.duels.myDeck() || '', key: 'deck_name', sortable: false },
  { title: LL.value?.statistics.matchup.matches() || '', key: 'total_duels', sortable: true },
  { title: LL.value?.statistics.matchup.winRate() || '', key: 'win_rate', sortable: true },
]);

const matchupHeaders = computed(() => [
  { title: LL.value?.statistics.matchup.myDeck() || '', key: 'deck_name', sortable: false },
  { title: LL.value?.statistics.matchup.opponent() || '', key: 'opponent_deck_name', sortable: false },
  { title: LL.value?.statistics.matchup.matches() || '', key: 'total_duels', sortable: true },
  { title: LL.value?.statistics.matchup.winRate() || '', key: 'win_rate', sortable: true },
  { title: LL.value?.statistics.matchup.firstWinRate() || '', key: 'win_rate_first', sortable: true },
  { title: LL.value?.statistics.matchup.secondWinRate() || '', key: 'win_rate_second', sortable: true },
]);
</script>

<style scoped>
.stats-card {
  height: 100%;
}

.no-data-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 250px;
}

/* 横スクロール用コンテナ */
.table-scroll-container {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

/* チャート横スクロール用コンテナ */
.chart-scroll-container {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.chart-inner {
  min-width: 600px;
}

.matchup-table {
  min-width: 750px;

  :deep(table) {
    min-width: 750px;
    width: 100%;
  }

  :deep(th),
  :deep(td) {
    white-space: nowrap !important;
    padding: 8px 12px !important;
  }
}

/* モバイル用追加調整 */
@media (max-width: 599px) {
  .matchup-table {
    :deep(th),
    :deep(td) {
      font-size: 12px !important;
      padding: 6px 10px !important;
    }

    :deep(.v-chip) {
      font-size: 11px !important;
      height: 22px !important;
      padding: 0 6px !important;
    }
  }
}
</style>
