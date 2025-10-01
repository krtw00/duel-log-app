<template>
  <v-app>
    <!-- ナビゲーションバー -->
    <app-bar current-view="dashboard" />

    <!-- メインコンテンツ -->
    <v-main class="main-content">
      <v-container fluid class="pa-6">
        <!-- 統計カード -->
        <v-row class="mb-4">
          <v-col cols="12" sm="4" md="2">
            <stat-card
              title="総試合数"
              :value="stats.total_duels"
              icon="mdi-sword-cross"
              color="primary"
            />
          </v-col>
          <v-col cols="12" sm="4" md="2">
            <stat-card
              title="コイン勝率"
              :value="`${(stats.coin_win_rate * 100).toFixed(1)}%`"
              icon="mdi-poker-chip"
              color="yellow"
            />
          </v-col>
          <v-col cols="12" sm="4" md="2">
            <stat-card
              title="先行率"
              :value="`${(stats.go_first_rate * 100).toFixed(1)}%`"
              icon="mdi-arrow-up-bold-hexagon-outline"
              color="teal"
            />
          </v-col>
          <v-col cols="12" sm="4" md="2">
            <stat-card
              title="勝率"
              :value="`${(stats.win_rate * 100).toFixed(1)}%`"
              icon="mdi-trophy"
              color="success"
            />
          </v-col>
          <v-col cols="12" sm="4" md="2">
            <stat-card
              title="先攻勝率"
              :value="`${(stats.first_turn_win_rate * 100).toFixed(1)}%`"
              icon="mdi-lightning-bolt"
              color="warning"
            />
          </v-col>
          <v-col cols="12" sm="4" md="2">
            <stat-card
              title="後攻勝率"
              :value="`${(stats.second_turn_win_rate * 100).toFixed(1)}%`"
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
            :duels="duels"
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
      @saved="handleSaved"
    />
  </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '../services/api'
import { Duel, DuelStats, Deck } from '../types'
import StatCard from '../components/duel/StatCard.vue'
import DuelTable from '../components/duel/DuelTable.vue'
import DuelFormDialog from '../components/duel/DuelFormDialog.vue'
import AppBar from '../components/layout/AppBar.vue'



const duels = ref<Duel[]>([])
const loading = ref(false)
const dialogOpen = ref(false)
const selectedDuel = ref<Duel | null>(null)
const decks = ref<Deck[]>([])

const stats = ref<DuelStats>({
  total_duels: 0,
  win_count: 0,
  lose_count: 0,
  win_rate: 0,
  first_turn_win_rate: 0,
  second_turn_win_rate: 0,
  coin_win_rate: 0,
  go_first_rate: 0,
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
    
    calculateStats()
  } catch (error) {
    console.error('Failed to fetch duels:', error)
  } finally {
    loading.value = false
  }
}

const calculateStats = () => {
  const total = duels.value.length
  if (total === 0) {
    stats.value = {
      total_duels: 0,
      win_count: 0,
      lose_count: 0,
      win_rate: 0,
      first_turn_win_rate: 0,
      second_turn_win_rate: 0,
      coin_win_rate: 0,
      go_first_rate: 0,
    }
    return
  }

  const wins = duels.value.filter(d => d.result === true).length
  const coinWins = duels.value.filter(d => d.coin === true).length
  const firstTurnTotal = duels.value.filter(d => d.first_or_second === true).length
  const firstTurnWins = duels.value.filter(d => d.result === true && d.first_or_second === true).length
  const secondTurnTotal = duels.value.filter(d => d.first_or_second === false).length
  const secondTurnWins = duels.value.filter(d => d.result === true && d.first_or_second === false).length

  stats.value = {
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
  } catch (error) {
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
</style>