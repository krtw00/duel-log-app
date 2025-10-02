<template>
  <v-app>
    <!-- ナビゲーションバー -->
    <app-bar current-view="dashboard" />

    <!-- メインコンテンツ -->
    <v-main class="main-content">
      <v-container fluid class="pa-6">
        <!-- ゲームモード切り替えタブ -->
        <v-card class="mode-tab-card mb-4">
          <v-tabs
            v-model="currentMode"
            color="primary"
            align-tabs="center"
            height="64"
            @update:model-value="handleModeChange"
          >
            <v-tab value="RANK" class="custom-tab">
              <v-icon start>mdi-crown</v-icon>
              ランク
              <v-chip class="ml-2" size="small" color="primary">
                {{ rankDuels.length }}
              </v-chip>
            </v-tab>
            <v-tab value="RATE" class="custom-tab">
              <v-icon start>mdi-chart-line</v-icon>
              レート
              <v-chip class="ml-2" size="small" color="info">
                {{ rateDuels.length }}
              </v-chip>
            </v-tab>
            <v-tab value="EVENT" class="custom-tab">
              <v-icon start>mdi-calendar-star</v-icon>
              イベント
              <v-chip class="ml-2" size="small" color="secondary">
                {{ eventDuels.length }}
              </v-chip>
            </v-tab>
            <v-tab value="DC" class="custom-tab">
              <v-icon start>mdi-trophy-variant</v-icon>
              DC
              <v-chip class="ml-2" size="small" color="warning">
                {{ dcDuels.length }}
              </v-chip>
            </v-tab>
          </v-tabs>
        </v-card>

        <!-- 統計カード -->
        <v-row class="mb-4">
          <v-col cols="12" sm="4" md="2">
            <stat-card
              title="総試合数"
              :value="currentStats.total_duels"
              icon="mdi-sword-cross"
              color="primary"
            />
          </v-col>
          <v-col cols="12" sm="4" md="2">
            <stat-card
              title="コイン勝率"
              :value="`${(currentStats.coin_win_rate * 100).toFixed(1)}%`"
              icon="mdi-poker-chip"
              color="yellow"
            />
          </v-col>
          <v-col cols="12" sm="4" md="2">
            <stat-card
              title="先行率"
              :value="`${(currentStats.go_first_rate * 100).toFixed(1)}%`"
              icon="mdi-arrow-up-bold-hexagon-outline"
              color="teal"
            />
          </v-col>
          <v-col cols="12" sm="4" md="2">
            <stat-card
              title="勝率"
              :value="`${(currentStats.win_rate * 100).toFixed(1)}%`"
              icon="mdi-trophy"
              color="success"
            />
          </v-col>
          <v-col cols="12" sm="4" md="2">
            <stat-card
              title="先攻勝率"
              :value="`${(currentStats.first_turn_win_rate * 100).toFixed(1)}%`"
              icon="mdi-lightning-bolt"
              color="warning"
            />
          </v-col>
          <v-col cols="12" sm="4" md="2">
            <stat-card
              title="後攻勝率"
              :value="`${(currentStats.second_turn_win_rate * 100).toFixed(1)}%`"
              icon="mdi-shield"
              color="secondary"
            />
          </v-col>
        </v-row>

        <!-- デュエルテーブル -->
        <v-card class="duel-card">
          <v-card-title class="d-flex align-center pa-4">
            <v-icon class="mr-2" color="primary">mdi-table</v-icon>
            <span class="text-h6">対戦履歴</span>
            <v-spacer />
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              @click="openDuelDialog"
              class="add-btn"
            >
              対戦記録を追加
            </v-btn>
          </v-card-title>

          <v-divider />

          <duel-table
            :duels="currentDuels"
            :loading="loading"
            @refresh="fetchDuels"
            @edit="editDuel"
            @delete="deleteDuel"
          />
        </v-card>
      </v-container>
    </v-main>

    <!-- 対戦記録入力ダイアログ -->
    <duel-form-dialog
      v-model="dialogOpen"
      :duel="selectedDuel"
      :default-game-mode="currentMode"
      @saved="handleSaved"
    />
  </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { api } from '../services/api'
import { Duel, DuelStats, Deck, GameMode } from '../types'
import StatCard from '../components/duel/StatCard.vue'
import DuelTable from '../components/duel/DuelTable.vue'
import DuelFormDialog from '../components/duel/DuelFormDialog.vue'
import AppBar from '../components/layout/AppBar.vue'
import { useNotificationStore } from '../stores/notification'

const notificationStore = useNotificationStore()

const duels = ref<Duel[]>([])
const loading = ref(false)
const dialogOpen = ref(false)
const selectedDuel = ref<Duel | null>(null)
const decks = ref<Deck[]>([])
const currentMode = ref<GameMode>('RANK')

// ゲームモード別にデュエルをフィルタリング
const rankDuels = computed(() => duels.value.filter(d => d.game_mode === 'RANK'))
const rateDuels = computed(() => duels.value.filter(d => d.game_mode === 'RATE'))
const eventDuels = computed(() => duels.value.filter(d => d.game_mode === 'EVENT'))
const dcDuels = computed(() => duels.value.filter(d => d.game_mode === 'DC'))

const currentDuels = computed(() => {
  switch (currentMode.value) {
    case 'RANK':
      return rankDuels.value
    case 'RATE':
      return rateDuels.value
    case 'EVENT':
      return eventDuels.value
    case 'DC':
      return dcDuels.value
    default:
      return []
  }
})

const emptyStats = (): DuelStats => ({
  total_duels: 0,
  win_count: 0,
  lose_count: 0,
  win_rate: 0,
  first_turn_win_rate: 0,
  second_turn_win_rate: 0,
  coin_win_rate: 0,
  go_first_rate: 0,
})

const rankStats = ref<DuelStats>(emptyStats())
const rateStats = ref<DuelStats>(emptyStats())
const eventStats = ref<DuelStats>(emptyStats())
const dcStats = ref<DuelStats>(emptyStats())

const currentStats = computed(() => {
  switch (currentMode.value) {
    case 'RANK':
      return rankStats.value
    case 'RATE':
      return rateStats.value
    case 'EVENT':
      return eventStats.value
    case 'DC':
      return dcStats.value
    default:
      return emptyStats()
  }
})

const fetchDuels = async () => {
  loading.value = true
  try {
    // デッキ情報を先に取得
    const decksResponse = await api.get('/decks/')
    decks.value = decksResponse.data
    
    // デュエル情報を取得
    const duelsResponse = await api.get('/duels/')
    duels.value = duelsResponse.data.map((duel: Duel) => ({
      ...duel,
      deck: decks.value.find(d => d.id === duel.deck_id),
      opponentdeck: decks.value.find(d => d.id === duel.opponentDeck_id)
    }))
    
    // 各モードの統計を計算
    rankStats.value = calculateStats(rankDuels.value)
    rateStats.value = calculateStats(rateDuels.value)
    eventStats.value = calculateStats(eventDuels.value)
    dcStats.value = calculateStats(dcDuels.value)
  } catch (error) {
    console.error('Failed to fetch duels:', error)
  } finally {
    loading.value = false
  }
}

const calculateStats = (duelList: Duel[]): DuelStats => {
  const total = duelList.length
  if (total === 0) {
    return emptyStats()
  }

  const wins = duelList.filter(d => d.result === true).length
  const coinWins = duelList.filter(d => d.coin === true).length
  const firstTurnTotal = duelList.filter(d => d.first_or_second === true).length
  const firstTurnWins = duelList.filter(d => d.result === true && d.first_or_second === true).length
  const secondTurnTotal = duelList.filter(d => d.first_or_second === false).length
  const secondTurnWins = duelList.filter(d => d.result === true && d.first_or_second === false).length

  return {
    total_duels: total,
    win_count: wins,
    lose_count: total - wins,
    win_rate: wins / total,
    coin_win_rate: coinWins / total,
    go_first_rate: firstTurnTotal / total,
    first_turn_win_rate: firstTurnTotal > 0 ? firstTurnWins / firstTurnTotal : 0,
    second_turn_win_rate: secondTurnTotal > 0 ? secondTurnWins / secondTurnTotal : 0,
  }
}

const handleModeChange = (mode: GameMode) => {
  currentMode.value = mode
}

const openDuelDialog = () => {
  selectedDuel.value = null
  dialogOpen.value = true
}

const editDuel = (duel: Duel) => {
  selectedDuel.value = duel
  dialogOpen.value = true
}

const deleteDuel = async (duelId: number) => {
  if (!confirm('この対戦記録を削除しますか？')) return
  
  try {
    await api.delete(`/duels/${duelId}`)
    await fetchDuels()
    notificationStore.success('対戦記録を削除しました')
  } catch (error) {
    // エラーはAPIインターセプターで処理される
    console.error('Failed to delete duel:', error)
  }
}

const handleSaved = () => {
  dialogOpen.value = false
  fetchDuels()
}

onMounted(() => {
  fetchDuels()
})
</script>

<style scoped lang="scss">
.main-content {
  background: #0a0e27;
  min-height: 100vh;
}

.mode-tab-card {
  background: rgba(18, 22, 46, 0.95) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 217, 255, 0.1);
  border-radius: 12px !important;
}

.duel-card {
  background: rgba(18, 22, 46, 0.95) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 217, 255, 0.1);
  border-radius: 12px !important;
}

.add-btn {
  font-weight: 600;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 217, 255, 0.3);
  }
}

.custom-tab {
  font-size: 1rem; // Adjust font size as needed
  padding: 0 24px; // Adjust padding as needed
  transition: background-color 0.3s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
}
</style>
