<template>
  <v-app>
    <!-- ナビゲーションバー -->
    <app-bar current-view="statistics" />

    <!-- メインコンテンツ -->
    <v-main class="main-content">
      <v-container fluid class="pa-6">
        <h1 class="text-h4 text-white mb-6">統計情報</h1>

        <v-row>
          <!-- 月間デッキ分布 -->
          <v-col cols="12" md="6">
            <v-card class="stats-card">
              <v-card-title>月間デッキ分布 ({{ currentMonth }})</v-card-title>
              <v-card-text>
                <apexchart
                  v-if="!loading && monthlyDistribution.series[0].data.length > 0"
                  type="pie"
                  height="350"
                  :options="monthlyDistribution.chartOptions"
                  :series="monthlyDistribution.series"
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
                  v-if="!loading && recentDistribution.series[0].data.length > 0"
                  type="pie"
                  height="350"
                  :options="recentDistribution.chartOptions"
                  :series="recentDistribution.series"
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
                  :items="matchupData"
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
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { api } from '../services/api'
import AppBar from '../components/layout/AppBar.vue'

const loading = ref(true)

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

const monthlyDistribution = ref({
  series: [{ data: [] as number[] }],
  chartOptions: { ...baseChartOptions, labels: [] as string[] },
})

const recentDistribution = ref({
  series: [{ data: [] as number[] }],
  chartOptions: { ...baseChartOptions, labels: [] as string[] },
})

const currentMonth = computed(() => {
  const now = new Date()
  return `${now.getFullYear()}年${now.getMonth() + 1}月`
})

// --- Matchup Chart --- //
const matchupData = ref<any[]>([])
const matchupHeaders = [
  { title: '自分のデッキ', key: 'my_deck_name', sortable: true },
  { title: '相手のデッキ', key: 'opponent_deck_name', sortable: true },
  { title: '勝利数', key: 'wins', sortable: true },
  { title: '敗北数', key: 'losses', sortable: true },
  { title: '勝率', key: 'win_rate', sortable: true },
]

const getWinRateColor = (winRate: number) => {
  if (winRate >= 60) return 'success'
  if (winRate >= 40) return 'warning'
  return 'error'
}

// --- Data Fetching --- //
onMounted(async () => {
  loading.value = true
  try {
    // 並列でAPIをコール
    const [monthlyRes, recentRes, matchupRes] = await Promise.all([
      api.get('/statistics/deck-distribution/monthly'),
      api.get('/statistics/deck-distribution/recent'),
      api.get('/statistics/matchup-chart'),
    ])

    // 月間分布
    monthlyDistribution.value = {
      series: [{
        data: monthlyRes.data.map((d: any) => d.count),
      }],
      chartOptions: {
        ...baseChartOptions,
        labels: monthlyRes.data.map((d: any) => d.deck_name),
      },
    }

    // 直近分布
    recentDistribution.value = {
      series: [{
        data: recentRes.data.map((d: any) => d.count),
      }],
      chartOptions: {
        ...baseChartOptions,
        labels: recentRes.data.map((d: any) => d.deck_name),
      },
    }

    // 相性表
    matchupData.value = matchupRes.data

  } catch (error) {
    console.error("Failed to fetch statistics:", error)
  } finally {
    loading.value = false
  }
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