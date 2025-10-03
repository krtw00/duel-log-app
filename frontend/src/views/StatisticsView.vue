<template>
  <v-app>
    <!-- ナビゲーションバー -->
    <app-bar current-view="statistics" />

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
import { ref, onMounted, computed } from 'vue'
import { api } from '../services/api'
import AppBar from '../components/layout/AppBar.vue'

const loading = ref(true)
const currentTab = ref('RANK') // 'summary'から'RANK'に変更

// 年月選択関連
const selectedYear = ref(new Date().getFullYear())
const selectedMonth = ref(new Date().getMonth() + 1)
const years = computed(() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => currentYear - i) // 過去5年
})
const months = Array.from({ length: 12 }, (_, i) => i + 1)

// --- Deck Distribution --- //
const baseChartOptions = {
  chart: {
    type: 'pie',
    background: 'transparent',
  },
  labels: [],
  theme: {
    mode: 'dark',
    monochrome: {
      enabled: true,
      color: '#00d9ff',
      shadeTo: 'dark',
      shadeIntensity: 0.65
    }
  },
  legend: {
    position: 'bottom'
  },
  responsive: [{
    breakpoint: 480,
    options: {
      chart: {
        width: 200
      },
      legend: {
        position: 'bottom'
      }
    }
  }]
}

// 各ゲームモードごとの統計データを保持するオブジェクト
const statisticsByMode = ref({
  RANK: {
    monthlyDistribution: { series: [{ data: [] as number[] }], chartOptions: { ...baseChartOptions, labels: [] as string[] } },
    recentDistribution: { series: [{ data: [] as number[] }], chartOptions: { ...baseChartOptions, labels: [] as string[] } },
    matchupData: [] as any[],
    timeSeries: { series: [{ name: 'ランク', data: [] as number[] }], chartOptions: { ...lineChartBaseOptions, xaxis: { ...lineChartBaseOptions.xaxis, categories: [] as number[] }, colors: ['#00d9ff'] } }, // 初期化時に参照
  },
  RATE: {
    monthlyDistribution: { series: [{ data: [] as number[] }], chartOptions: { ...baseChartOptions, labels: [] as string[] } },
    recentDistribution: { series: [{ data: [] as number[] }], chartOptions: { ...baseChartOptions, labels: [] as string[] } },
    matchupData: [] as any[],
    timeSeries: { series: [{ name: 'レート', data: [] as number[] }], chartOptions: { ...lineChartBaseOptions, xaxis: { ...lineChartBaseOptions.xaxis, categories: [] as number[] }, colors: ['#00d9ff'] } }, // 初期化時に参照
  },
  EVENT: {
    monthlyDistribution: { series: [{ data: [] as number[] }], chartOptions: { ...baseChartOptions, labels: [] as string[] } },
    recentDistribution: { series: [{ data: [] as number[] }], chartOptions: { ...baseChartOptions, labels: [] as string[] } },
    matchupData: [] as any[],
    timeSeries: { series: [{ name: 'イベント', data: [] as number[] }], chartOptions: { ...lineChartBaseOptions, xaxis: { ...lineChartBaseOptions.xaxis, categories: [] as number[] }, colors: ['#00d9ff'] } }, // 初期化時に参照
  },
  DC: {
    monthlyDistribution: { series: [{ data: [] as number[] }], chartOptions: { ...baseChartOptions, labels: [] as string[] } },
    recentDistribution: { series: [{ data: [] as number[] }], chartOptions: { ...baseChartOptions, labels: [] as string[] } },
    matchupData: [] as any[],
    timeSeries: { series: [{ name: 'DC', data: [] as number[] }], chartOptions: { ...lineChartBaseOptions, xaxis: { ...lineChartBaseOptions.xaxis, categories: [] as number[] }, colors: ['#b536ff'] } }, // 初期化時に参照
  },
})
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