<template>
  <v-row>
    <!-- 月間デッキ分布 -->
    <v-col cols="12" lg="6">
      <v-card :class="statsCardClass">
        <v-card-title>月間デッキ分布 ({{ displayMonth }})</v-card-title>
        <v-card-text>
          <apexchart
            v-if="
              statistics.monthlyDistribution &&
              statistics.monthlyDistribution.series &&
              statistics.monthlyDistribution.series.length > 0
            "
            type="pie"
            height="350"
            :options="statistics.monthlyDistribution.chartOptions"
            :series="statistics.monthlyDistribution.series"
          ></apexchart>
          <div v-else class="no-data-placeholder">
            <v-icon size="64" color="grey">mdi-chart-pie</v-icon>
            <p class="text-body-1 text-grey mt-4">データがありません</p>
          </div>
        </v-card-text>
      </v-card>
    </v-col>

    <!-- 月間対戦一覧 -->
    <v-col cols="12" lg="6">
      <v-card :class="statsCardClass">
        <v-card-title class="d-flex align-center justify-space-between">
          <span>月間対戦一覧 ({{ displayMonth }})</span>
          <v-chip size="small" variant="outlined">
            全 {{ (statistics.duels || []).length }} 件
          </v-chip>
        </v-card-title>
        <v-card-text>
          <duel-table
            :duels="statistics.duels || []"
            :loading="loading"
            :show-actions="!isShared"
            :hidden-columns="isShared ? ['actions'] : []"
            table-height="480px"
          />
        </v-card-text>
      </v-card>
    </v-col>

    <!-- 自分のデッキ勝率 -->
    <v-col cols="12">
      <v-card :class="statsCardClass">
        <v-card-title>自分のデッキ勝率</v-card-title>
        <v-card-text>
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
                <p class="text-body-1 text-grey mt-4">データがありません</p>
              </div>
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
    </v-col>

    <!-- 相性表 -->
    <v-col cols="12">
      <v-card :class="statsCardClass">
        <v-card-title>デッキ相性表</v-card-title>
        <v-card-text>
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
                <p class="text-body-1 text-grey mt-4">相性データがありません</p>
              </div>
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
    </v-col>

    <!-- レート/DC変動グラフ (RATEとDCタブのみ) -->
    <v-col v-if="gameMode === 'RATE' || gameMode === 'DC'" cols="12">
      <v-card :class="statsCardClass">
        <v-card-title
          >{{ gameMode === 'RATE' ? 'レート変動' : 'DC変動' }} ({{ displayMonth }})</v-card-title
        >
        <v-card-text>
          <apexchart
            v-if="
              statistics.valueSequence &&
              statistics.valueSequence.series &&
              statistics.valueSequence.series[0] &&
              statistics.valueSequence.series[0].data &&
              statistics.valueSequence.series[0].data.length > 0
            "
            type="line"
            height="350"
            :options="statistics.valueSequence.chartOptions"
            :series="statistics.valueSequence.series"
          ></apexchart>
          <div v-else class="no-data-placeholder">
            <v-icon size="64" color="grey">{{
              gameMode === 'RATE' ? 'mdi-chart-line' : 'mdi-trophy-variant'
            }}</v-icon>
            <p class="text-body-1 text-grey mt-4">データがありません</p>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useThemeStore } from '@/stores/theme';
import DuelTable from '@/components/duel/DuelTable.vue';
import type { Duel, MatchupData } from '@/types';
import type { ApexPieChartOptions, ApexLineChartOptions, ApexLineChartSeries } from '@/types/chart';

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

// 優勢: 赤 / 劣勢: 青（Issue #39 の要件に合わせる）
const getMatchupColor = (value: number) => {
  const percent = normalizePercent(value);
  if (percent >= 55) return 'error';
  if (percent <= 45) return 'info';
  return undefined;
};

const statsCardClass = computed(() => [
  'stats-card',
  themeStore.isDark ? 'stats-card--dark' : 'stats-card--light',
]);

const myDeckWinRatesHeaders = [
  { title: '自分のデッキ', key: 'deck_name', sortable: false },
  { title: '対戦数', key: 'total_duels', sortable: true },
  { title: '勝率', key: 'win_rate', sortable: true },
];

const matchupHeaders = [
  { title: '使用デッキ', key: 'deck_name', sortable: false },
  { title: '相手デッキ', key: 'opponent_deck_name', sortable: false },
  { title: '対戦数', key: 'total_duels', sortable: true },
  { title: '勝率', key: 'win_rate', sortable: true },
  { title: '先攻勝率', key: 'win_rate_first', sortable: true },
  { title: '後攻勝率', key: 'win_rate_second', sortable: true },
];
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
  min-height: 350px;
}

.matchup-table {
  width: 100%;
}
</style>
