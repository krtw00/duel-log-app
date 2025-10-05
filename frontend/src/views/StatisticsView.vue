<template>
  <v-app>
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
        <h1 class="text-h4 text-white mb-6">統計情報</h1>

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
          <v-tabs
            v-model="currentTab"
            color="primary"
            align-tabs="center"
            height="64"
          >
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
          <v-window-item
            v-for="mode in ['RANK', 'RATE', 'EVENT', 'DC']"
            :key="mode"
            :value="mode"
          >
            <v-row>
              <!-- 月間デッキ分布 -->
              <v-col cols="12" md="6">
                <v-card class="stats-card">
                  <v-card-title>月間デッキ分布 ({{ currentMonth }})</v-card-title>
                  <v-card-text>
                    <apexchart
                      v-if="!loading && statisticsByMode[mode].monthlyDistribution.series[0].data.length > 0"
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
                      v-if="!loading && statisticsByMode[mode].recentDistribution.series[0].data.length > 0"
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
                      <template #item.win_rate="{ item }">
                        <v-chip :color="getWinRateColor(item.win_rate)" variant="flat">
                          {{ item.win_rate.toFixed(1) }}%
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
              <v-col cols="12" v-if="mode === 'RATE' || mode === 'DC'">
                <v-card class="stats-card">
                  <v-card-title>{{ mode === 'RATE' ? 'レート変動' : 'DC変動' }} ({{ currentMonth }})</v-card-title>
                  <v-card-text>
                    <apexchart
                      v-if="!loading && statisticsByMode[mode].timeSeries.series[0].data.length > 0"
                      type="line"
                      height="350"
                      :options="statisticsByMode[mode].timeSeries.chartOptions"
                      :series="statisticsByMode[mode].timeSeries.series"
                    ></apexchart>
                    <div v-else class="no-data-placeholder">
                      <v-icon size="64" color="grey">{{ mode === 'RATE' ? 'mdi-chart-line' : 'mdi-trophy-variant' }}</v-icon>
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
  </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { api } from '../services/api';
import AppBar from '../components/layout/AppBar.vue';

const drawer = ref(false);
const navItems = [
  { name: 'ダッシュボード', path: '/', view: 'dashboard', icon: 'mdi-view-dashboard' },
  { name: 'デッキ管理', path: '/decks', view: 'decks', icon: 'mdi-cards' },
  { name: '統計', path: '/statistics', view: 'statistics', icon: 'mdi-chart-bar' }
];

// --- Types ---
interface DistributionData {
  series: { data: number[] }[];
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
const baseChartOptions = {
  chart: { type: 'pie', background: 'transparent' },
  labels: [],
  theme: {
    mode: 'dark',
    monochrome: { enabled: true, color: '#00d9ff', shadeTo: 'dark', shadeIntensity: 0.65 },
  },
  legend: { position: 'bottom' },
  responsive: [{
    breakpoint: 480,
    options: {
      chart: { width: 200 },
      legend: { position: 'bottom' },
    },
  }],
};

const lineChartBaseOptions = {
  chart: { type: 'line', background: 'transparent', zoom: { enabled: false }, toolbar: { show: false } },
  xaxis: {
    type: 'numeric',
    title: { text: '対戦数', style: { color: '#E4E7EC' } },
    labels: { style: { colors: '#E4E7EC' } },
  },
  yaxis: { labels: { style: { colors: '#E4E7EC' } } },
  stroke: { curve: 'smooth', width: 3 },
  markers: { size: 4, colors: ['#00d9ff'], strokeColors: '#fff', strokeWidth: 2, hover: { size: 7 } },
  grid: { borderColor: 'rgba(0, 217, 255, 0.1)', strokeDashArray: 4 },
  tooltip: { theme: 'dark' },
  dataLabels: { enabled: false },
  theme: { mode: 'dark' },
};

// --- Statistics Data ---
const createInitialStats = (): AllStatisticsData => {
  const modes = ['RANK', 'RATE', 'EVENT', 'DC'];
  const stats: AllStatisticsData = {};
  modes.forEach(mode => {
    stats[mode] = {
      monthlyDistribution: { series: [{ data: [] }], chartOptions: { ...baseChartOptions, labels: [] } },
      recentDistribution: { series: [{ data: [] }], chartOptions: { ...baseChartOptions, labels: [] } },
      matchupData: [],
      timeSeries: {
        series: [{ name: mode, data: [] }],
        chartOptions: {
          ...lineChartBaseOptions,
          xaxis: { ...lineChartBaseOptions.xaxis, categories: [] },
          colors: [mode === 'DC' ? '#b536ff' : '#00d9ff'],
        },
      },
    };
  });
  return stats;
};

const statisticsByMode = ref<AllStatisticsData>(createInitialStats());

// --- Data Table ---
const matchupHeaders = [
  { title: '使用デッキ', key: 'deck_name', sortable: false },
  { title: '相手デッキ', key: 'opponent_deck_name', sortable: false },
  { title: '対戦数', key: 'total_duels', sortable: true },
  { title: '勝率', key: 'win_rate', sortable: true },
];

const getWinRateColor = (winRate: number) => {
  if (winRate >= 60) return 'success';
  if (winRate >= 40) return 'warning';
  return 'error';
};

// --- API Call ---
const fetchStatistics = async () => {
  loading.value = true;
  try {
    const { data } = await api.get('/statistics', {
      params: {
        year: selectedYear.value,
        month: selectedMonth.value,
      },
    });

    const newStats = createInitialStats();
    
    Object.keys(data).forEach(mode => {
      if (newStats[mode]) {
        const stats = data[mode];
        // Monthly Distribution
        newStats[mode].monthlyDistribution.series = [{ data: stats.monthly_deck_distribution.map((d: any) => d.count) }];
        newStats[mode].monthlyDistribution.chartOptions.labels = stats.monthly_deck_distribution.map((d: any) => d.deck_name);

        // Recent Distribution
        newStats[mode].recentDistribution.series = [{ data: stats.recent_deck_distribution.map((d: any) => d.count) }];
        newStats[mode].recentDistribution.chartOptions.labels = stats.recent_deck_distribution.map((d: any) => d.deck_name);
        
        // Matchup Data
        newStats[mode].matchupData = stats.matchup_data;

        // Time Series
        if (stats.time_series_data) {
          newStats[mode].timeSeries.series = [{
            name: mode,
            data: stats.time_series_data.map((d: any) => d.value)
          }];
          newStats[mode].timeSeries.chartOptions.xaxis.categories = stats.time_series_data.map((_: any, i: number) => i + 1);
        }
      }
    });
    statisticsByMode.value = newStats;

  } catch (error) {
    console.error('Failed to fetch statistics:', error);
    // You might want to show a notification to the user here
  } finally {
    loading.value = false;
  }
};

onMounted(fetchStatistics);

watch([selectedYear, selectedMonth], fetchStatistics);
</script>

<style scoped lang="scss">
.main-content {
  background: #0a0e27;
  min-height: 100vh;
}

.stats-card {
  background: rgba(18, 22, 46, 0.95) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 217, 255, 0.1);
  border-radius: 12px !important;
  color: #fff;
}

.no-data-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 350px;
}

.matchup-table {
  background: transparent !important;

  .v-data-table__th {
    background: rgba(26, 31, 58, 0.5) !important;
    color: rgba(228, 231, 236, 0.8) !important;
    font-weight: 600 !important;
  }

  .v-data-table__td {
    border-bottom: 1px solid rgba(0, 217, 255, 0.05) !important;
  }
}
</style>