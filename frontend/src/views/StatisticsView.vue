<template>
  <div>
    <!-- ナビゲーションバー -->
    <app-bar current-view="statistics" @toggle-drawer="drawer = !drawer" />

    <!-- レスポンシブ対応のナビゲーションドロワー -->
    <v-navigation-drawer v-model="drawer" temporary>
      <v-list nav dense>
        <v-list-item
          v-for="item in navItems"
          :key="item.view"
          :prepend-icon="item.icon"
          :to="item.path"
          :title="item.name"
        />
      </v-list>
    </v-navigation-drawer>

    <!-- メインコンテンツ -->
    <v-main class="main-content">
      <v-container fluid class="pa-6">
        <div class="d-flex align-center justify-space-between mb-6">
          <h1 class="statistics-title text-h4">統計情報</h1>
          <v-btn
            v-if="authStore.isStreamerModeEnabled"
            color="primary"
            variant="outlined"
            prepend-icon="mdi-monitor-screenshot"
            @click="showOBSDialog = true"
          >
            OBS連携
          </v-btn>
        </div>

        <!-- 年月選択 -->
        <v-row class="mb-4">
          <v-col cols="6" sm="3">
            <v-select
              v-model="selectedYear"
              :items="years"
              label="年"
              variant="outlined"
              density="compact"
              hide-details
              @update:model-value="fetchStatistics"
            ></v-select>
          </v-col>
          <v-col cols="6" sm="3">
            <v-select
              v-model="selectedMonth"
              :items="months"
              label="月"
              variant="outlined"
              density="compact"
              hide-details
              @update:model-value="fetchStatistics"
            ></v-select>
          </v-col>
        </v-row>

        <!-- ゲームモード切り替えタブ -->
        <v-card class="mode-tab-card mb-4">
          <v-tabs v-model="currentTab" color="primary" align-tabs="center" height="64">
            <v-tab value="RANK" class="custom-tab">
              <v-icon start>mdi-crown</v-icon>
              ランク
            </v-tab>
            <v-tab value="RATE" class="custom-tab">
              <v-icon start>mdi-chart-line</v-icon>
              レート
            </v-tab>
            <v-tab value="EVENT" class="custom-tab">
              <v-icon start>mdi-calendar-star</v-icon>
              イベント
            </v-tab>
            <v-tab value="DC" class="custom-tab">
              <v-icon start>mdi-trophy-variant</v-icon>
              DC
            </v-tab>
          </v-tabs>
        </v-card>

        <v-window v-model="currentTab">
          <v-window-item v-for="mode in ['RANK', 'RATE', 'EVENT', 'DC']" :key="mode" :value="mode">
            <v-row>
              <!-- 月間デッキ分布 -->
              <v-col cols="12" md="6">
                <v-card class="stats-card">
                  <v-card-title>月間デッキ分布 ({{ currentMonth }})</v-card-title>
                  <v-card-text>
                    <apexchart
                      v-if="
                        !loading && statisticsByMode[mode].monthlyDistribution.series.length > 0
                      "
                      type="pie"
                      height="350"
                      :options="statisticsByMode[mode].monthlyDistribution.chartOptions"
                      :series="statisticsByMode[mode].monthlyDistribution.series"
                    ></apexchart>
                    <div v-else class="no-data-placeholder">
                      <v-icon size="64" color="grey">mdi-chart-pie</v-icon>
                      <p class="text-body-1 text-grey mt-4">データがありません</p>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>

              <!-- 直近30戦デッキ分布 -->
              <v-col cols="12" md="6">
                <v-card class="stats-card">
                  <v-card-title>直近30戦デッキ分布</v-card-title>
                  <v-card-text>
                    <apexchart
                      v-if="!loading && statisticsByMode[mode].recentDistribution.series.length > 0"
                      type="pie"
                      height="350"
                      :options="statisticsByMode[mode].recentDistribution.chartOptions"
                      :series="statisticsByMode[mode].recentDistribution.series"
                    ></apexchart>
                    <div v-else class="no-data-placeholder">
                      <v-icon size="64" color="grey">mdi-chart-donut</v-icon>
                      <p class="text-body-1 text-grey mt-4">データがありません</p>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>

              <!-- 自分のデッキ勝率 -->
              <v-col cols="12">
                <v-card class="stats-card">
                  <v-card-title>自分のデッキ勝率</v-card-title>
                  <v-card-text>
                    <v-data-table
                      :headers="myDeckWinRatesHeaders"
                      :items="statisticsByMode[mode].myDeckWinRates"
                      :loading="loading"
                      class="matchup-table"
                      density="compact"
                    >
                      <template #[`item.win_rate`]='{ item }'>
                        {{ item.wins }} / {{ item.total_duels }} ({{ item.win_rate.toFixed(1) }}%)
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
                <v-card class="stats-card">
                  <v-card-title>デッキ相性表</v-card-title>
                  <v-card-text>
                    <v-data-table
                      :headers="matchupHeaders"
                      :items="statisticsByMode[mode].matchupData"
                      :loading="loading"
                      class="matchup-table"
                      density="compact"
                    >
            <template #[`item.win_rate`]='{ item }'>
              {{ item.wins }} / {{ item.total_duels }} ({{ item.win_rate.toFixed(1) }}%)
            </template>
            <template #[`item.win_rate_first`]='{ item }'>
              {{ item.win_rate_first.toFixed(1) }}%
            </template>
            <template #[`item.win_rate_second`]='{ item }'>
              {{ item.win_rate_second.toFixed(1) }}%
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
              <v-col v-if="mode === 'RATE' || mode === 'DC'" cols="12">
                <v-card class="stats-card">
                  <v-card-title
                    >{{ mode === 'RATE' ? 'レート変動' : 'DC変動' }} ({{
                      currentMonth
                    }})</v-card-title
                  >
                  <v-card-text>
                    <apexchart
                      v-if="!loading && statisticsByMode[mode].timeSeries.series[0].data.length > 0"
                      type="line"
                      height="350"
                      :options="statisticsByMode[mode].timeSeries.chartOptions"
                      :series="statisticsByMode[mode].timeSeries.series"
                    ></apexchart>
                    <div v-else class="no-data-placeholder">
                      <v-icon size="64" color="grey">{{
                        mode === 'RATE' ? 'mdi-chart-line' : 'mdi-trophy-variant'
                      }}</v-icon>
                      <p class="text-body-1 text-grey mt-4">データがありません</p>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-window-item>
        </v-window>
      </v-container>
    </v-main>

    <!-- OBS連携モーダル -->
    <v-dialog v-model="showOBSDialog" max-width="700px">
      <v-card>
        <v-card-title class="d-flex align-center pa-4">
          <v-icon class="mr-2" color="primary">mdi-monitor-screenshot</v-icon>
          <span class="text-h5">OBS連携設定</span>
          <v-spacer />
          <v-btn icon variant="text" @click="showOBSDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-6">
          <p class="text-body-2 mb-4">
            OBSのブラウザソースで以下のURLを使用することで、試合の統計情報をリアルタイムでオーバーレイ表示できます。
          </p>

          <!-- 集計期間選択 -->
          <v-select
            v-model="obsPeriodType"
            :items="periodTypeOptions"
            label="集計期間"
            variant="outlined"
            density="compact"
            hide-details
            class="mb-4"
          ></v-select>

          <!-- 月間選択時の年月設定 -->
          <v-row v-if="obsPeriodType === 'monthly'" class="mb-4">
            <v-col cols="6">
              <v-select
                v-model="obsYear"
                :items="years"
                label="年"
                variant="outlined"
                density="compact"
                hide-details
              ></v-select>
            </v-col>
            <v-col cols="6">
              <v-select
                v-model="obsMonth"
                :items="months"
                label="月"
                variant="outlined"
                density="compact"
                hide-details
              ></v-select>
            </v-col>
          </v-row>

          <!-- 直近N戦選択時の試合数設定 -->
          <v-text-field
            v-if="obsPeriodType === 'recent'"
            v-model="obsLimit"
            label="表示する試合数"
            variant="outlined"
            density="compact"
            hide-details
            type="number"
            min="1"
            max="100"
            class="mb-4"
          ></v-text-field>

          <!-- 表示項目選択 -->
          <div class="mb-4">
            <p class="text-body-2 mb-2">表示項目</p>
            <v-row>
              <v-col
                v-for="item in displayItems"
                :key="item.value"
                cols="6"
                sm="4"
              >
                <v-checkbox
                  v-model="item.selected"
                  :label="item.label"
                  density="compact"
                  hide-details
                ></v-checkbox>
              </v-col>
            </v-row>
          </div>

          <v-select
            v-model="obsGameMode"
            :items="gameModeOptions"
            label="ゲームモード（任意）"
            variant="outlined"
            density="compact"
            hide-details
            clearable
            class="mb-4"
          ></v-select>

          <v-text-field
            v-model="obsRefreshInterval"
            label="更新間隔（ミリ秒）"
            variant="outlined"
            density="compact"
            hide-details
            type="number"
            class="mb-4"
          ></v-text-field>

          <v-alert type="info" variant="tonal" class="mb-4">
            <div class="text-body-2">
              <strong>OBSでの設定方法：</strong>
              <ol class="ml-4 mt-2">
                <li>OBSで「ソース」→「+」→「ブラウザ」を選択</li>
                <li>以下のURLをコピーして「URL」欄に貼り付け</li>
                <li>幅: 800px、高さ: 600px を推奨</li>
                <li>「カスタムCSS」で背景を透過: <code>body { background-color: transparent; }</code></li>
              </ol>
            </div>
          </v-alert>

          <v-text-field
            :model-value="obsUrl"
            label="OBS用URL"
            variant="outlined"
            density="compact"
            readonly
            class="mb-2"
          >
            <template #append-inner>
              <v-btn
                icon
                variant="text"
                size="small"
                @click="copyOBSUrl"
              >
                <v-icon>{{ urlCopied ? 'mdi-check' : 'mdi-content-copy' }}</v-icon>
              </v-btn>
            </template>
          </v-text-field>

          <p class="text-caption text-grey">
            ※ このURLには認証トークンが含まれています。他人と共有しないでください。
          </p>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn color="primary" variant="elevated" @click="showOBSDialog = false">
            閉じる
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { api } from '@/services/api';
import AppBar from '@/components/layout/AppBar.vue';
import { useThemeStore } from '@/stores/theme';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notification';

const themeStore = useThemeStore();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

const drawer = ref(false);
const navItems = [
  { name: 'ダッシュボード', path: '/', view: 'dashboard', icon: 'mdi-view-dashboard' },
  { name: 'デッキ管理', path: '/decks', view: 'decks', icon: 'mdi-cards' },
  { name: '統計', path: '/statistics', view: 'statistics', icon: 'mdi-chart-bar' },
];

// --- Types ---
interface DistributionData {
  series: number[];
  chartOptions: any;
}

interface TimeSeriesData {
  series: { name: string; data: number[] }[];
  chartOptions: any;
}

interface StatisticsModeData {
  monthlyDistribution: DistributionData;
  recentDistribution: DistributionData;
  matchupData: any[];
  myDeckWinRates: any[];
  timeSeries: TimeSeriesData;
}

interface AllStatisticsData {
  [key: string]: StatisticsModeData;
}

const loading = ref(true);
const currentTab = ref('RANK');

// --- Date Selection ---
const selectedYear = ref(new Date().getFullYear());
const selectedMonth = ref(new Date().getMonth() + 1);
const years = computed(() => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => currentYear - i);
});
const months = Array.from({ length: 12 }, (_, i) => i + 1);
const currentMonth = computed(() => `${selectedYear.value}年${selectedMonth.value}月`);

// --- Chart Base Options ---
const baseChartOptions = computed(() => ({
  chart: { type: 'pie', background: 'transparent' },
  labels: [],
  theme: {
    mode: themeStore.isDark ? 'dark' : 'light',
  },
  colors: ['#00D9FF', '#FF4560', '#775DD0', '#FEB019', '#00E396', '#D4526E', '#3F51B5', '#26A69A', '#E91E63', '#FFC107'],
  legend: {
    position: 'bottom',
    labels: {
      colors: themeStore.isDark ? '#fff' : '#000',
    },
  },
  responsive: [
    {
      breakpoint: 480,
      options: {
        chart: { width: 200 },
        legend: { position: 'bottom' },
      },
    },
  ],
}));

const lineChartBaseOptions = computed(() => ({
  chart: {
    type: 'line',
    background: 'transparent',
    zoom: { enabled: false },
    toolbar: { show: false },
  },
  xaxis: {
    type: 'numeric',
    title: { text: '対戦数', style: { color: themeStore.isDark ? '#E4E7EC' : '#333' } },
    labels: { style: { colors: themeStore.isDark ? '#E4E7EC' : '#333' } },
  },
  yaxis: { labels: { style: { colors: themeStore.isDark ? '#E4E7EC' : '#333' } } },
  stroke: { curve: 'smooth', width: 3 },
  markers: {
    size: 4,
    colors: ['#00d9ff'],
    strokeColors: '#fff',
    strokeWidth: 2,
    hover: { size: 7 },
  },
  grid: { borderColor: 'rgba(0, 217, 255, 0.1)', strokeDashArray: 4 },
  tooltip: { theme: themeStore.isDark ? 'dark' : 'light' },
  dataLabels: { enabled: false },
  theme: { mode: themeStore.isDark ? 'dark' : 'light' },
}));

// --- Statistics Data ---
const createInitialStats = (): AllStatisticsData => {
  const modes = ['RANK', 'RATE', 'EVENT', 'DC'];
  const stats: AllStatisticsData = {};
  modes.forEach((mode) => {
    stats[mode] = {
      monthlyDistribution: { series: [], chartOptions: { ...baseChartOptions.value, labels: [] } },
      recentDistribution: { series: [], chartOptions: { ...baseChartOptions.value, labels: [] } },
      matchupData: [],
      myDeckWinRates: [],
      timeSeries: {
        series: [{ name: mode, data: [] }],
        chartOptions: {
          ...lineChartBaseOptions.value,
          xaxis: { ...lineChartBaseOptions.value.xaxis, categories: [] },
          colors: [mode === 'DC' ? '#b536ff' : '#00d9ff'],
        },
      },
    };
  });
  return stats;
};

const statisticsByMode = ref<AllStatisticsData>(createInitialStats());

const fetchStatistics = async () => {
  loading.value = true;
  try {
    const params = { year: selectedYear.value, month: selectedMonth.value };
    const response = await api.get('/statistics/', { params });
    const data = response.data;

    const modes = ['RANK', 'RATE', 'EVENT', 'DC'];
    modes.forEach((mode) => {
      const modeData = data[mode] || {};
      // Monthly Distribution
      const monthlyLabels = modeData.monthly_deck_distribution?.map((d: any) => d.deck_name) || [];
      const monthlySeries = modeData.monthly_deck_distribution?.map((d: any) => d.count) || [];
      statisticsByMode.value[mode].monthlyDistribution = {
        series: monthlySeries,
        chartOptions: { ...baseChartOptions.value, labels: monthlyLabels },
      };

      // Recent Distribution
      const recentLabels = modeData.recent_deck_distribution?.map((d: any) => d.deck_name) || [];
      const recentSeries = modeData.recent_deck_distribution?.map((d: any) => d.count) || [];
      statisticsByMode.value[mode].recentDistribution = {
        series: recentSeries,
        chartOptions: { ...baseChartOptions.value, labels: recentLabels },
      };

      // Matchup Data
      statisticsByMode.value[mode].matchupData = modeData.matchup_data || [];

      // My Deck Win Rates
      statisticsByMode.value[mode].myDeckWinRates = modeData.my_deck_win_rates || [];

      // Time Series Data
      const timeSeriesData = modeData.time_series_data || [];
      const categories = timeSeriesData.map((_: any, i: number) => i + 1);
      const seriesData = timeSeriesData.map((d: any) => d.value);
      statisticsByMode.value[mode].timeSeries = {
        series: [{ name: mode, data: seriesData }],
        chartOptions: {
          ...lineChartBaseOptions.value,
          xaxis: { ...lineChartBaseOptions.value.xaxis, categories },
          colors: [mode === 'DC' ? '#b536ff' : '#00d9ff'],
        },
      };
    });
  } catch (error) {
    console.error('Failed to fetch statistics:', error);
  } finally {
    loading.value = false;
  }
};

// --- Data Table ---
const matchupHeaders = [
  { title: '使用デッキ', key: 'deck_name', sortable: false },
  { title: '相手デッキ', key: 'opponent_deck_name', sortable: false },
  { title: '対戦数', key: 'total_duels', sortable: true },
  { title: '勝率', key: 'win_rate', sortable: true },
  { title: '先攻勝率', key: 'win_rate_first', sortable: true },
  { title: '後攻勝率', key: 'win_rate_second', sortable: true },
];

const myDeckWinRatesHeaders = [
  { title: 'デッキ名', key: 'deck_name', sortable: true },
  { title: '対戦数', key: 'total_duels', sortable: true },
  { title: '勝率', key: 'win_rate', sortable: true },
];

// --- OBS連携 ---
const showOBSDialog = ref(false);
const obsPeriodType = ref('recent');
const obsYear = ref(new Date().getFullYear());
const obsMonth = ref(new Date().getMonth() + 1);
const obsLimit = ref(30);
const obsGameMode = ref<string | undefined>(undefined);
const obsRefreshInterval = ref(30000);
const urlCopied = ref(false);

const periodTypeOptions = [
  { title: '全期間', value: 'all' },
  { title: '月間', value: 'monthly' },
  { title: '直近N戦', value: 'recent' },
];

const displayItems = ref([
  { label: '使用デッキ', value: 'current_deck', selected: true },
  { label: 'ランク', value: 'current_rank', selected: true },
  { label: '総試合数', value: 'total_duels', selected: false },
  { label: '勝率', value: 'win_rate', selected: true },
  { label: '先行勝率', value: 'first_turn_win_rate', selected: true },
  { label: '後攻勝率', value: 'second_turn_win_rate', selected: true },
  { label: 'コイン勝率', value: 'coin_win_rate', selected: true },
  { label: '先行率', value: 'go_first_rate', selected: true },
]);

const gameModeOptions = [
  { title: 'ランク', value: 'RANK' },
  { title: 'レート', value: 'RATE' },
  { title: 'イベント', value: 'EVENT' },
  { title: 'DC', value: 'DC' },
];

const obsUrl = computed(() => {
  const baseUrl = window.location.origin;
  // localStorageから直接トークンを取得
  const accessToken = localStorage.getItem('access_token') || '';

  const params = new URLSearchParams({
    token: accessToken,
    period_type: obsPeriodType.value,
    refresh: obsRefreshInterval.value.toString(),
  });

  // 集計期間に応じたパラメータ
  if (obsPeriodType.value === 'monthly') {
    params.append('year', obsYear.value.toString());
    params.append('month', obsMonth.value.toString());
  } else if (obsPeriodType.value === 'recent') {
    params.append('limit', obsLimit.value.toString());
  }

  // 表示項目
  const selectedItems = displayItems.value
    .filter((item) => item.selected)
    .map((item) => item.value)
    .join(',');
  if (selectedItems) {
    params.append('display_items', selectedItems);
  }

  if (obsGameMode.value) {
    params.append('game_mode', obsGameMode.value);
  }

  return `${baseUrl}/obs-overlay?${params.toString()}`;
});

const copyOBSUrl = async () => {
  try {
    await navigator.clipboard.writeText(obsUrl.value);
    urlCopied.value = true;
    notificationStore.success('URLをコピーしました');
    setTimeout(() => {
      urlCopied.value = false;
    }, 2000);
  } catch (error) {
    notificationStore.error('URLのコピーに失敗しました');
  }
};

onMounted(fetchStatistics);

watch([selectedYear, selectedMonth], fetchStatistics);

// テーマ変更時にグラフを再描画
watch(() => themeStore.isDark, () => {
  fetchStatistics();
});
</script>

<style scoped lang="scss">
.main-content {
  min-height: 100vh;
}

.statistics-title {
  color: rgb(var(--v-theme-on-surface));
}

.stats-card {
  backdrop-filter: blur(10px);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 12px !important;
  background-color: rgba(var(--v-theme-surface), 0.92);
}

.no-data-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 350px;
  color: rgba(var(--v-theme-on-surface), 0.65);

  p {
    color: inherit;
  }
}

:deep(.stats-card .v-card-title) {
  color: rgb(var(--v-theme-on-surface));
  font-weight: 600;
}

:deep(.stats-card .v-card-text) {
  color: rgb(var(--v-theme-on-surface));
}

.matchup-table {
  background: transparent !important;
}

:deep(.matchup-table .v-data-table__th) {
  background: rgba(var(--v-theme-surface), 0.85) !important;
  color: rgba(var(--v-theme-on-surface), 0.75) !important;
  font-weight: 600 !important;
}

:deep(.matchup-table .v-data-table__td) {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.1) !important;
  color: rgba(var(--v-theme-on-surface), 0.9);
}
</style>
