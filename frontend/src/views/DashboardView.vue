<template>
  <div>
    <!-- ナビゲーションバー -->
    <app-bar current-view="dashboard" @toggle-drawer="drawer = !drawer" />

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
      <v-container fluid class="pa-6 pa-sm-6 pa-xs-3">
        <!-- ゲームモード切り替えタブ -->
        <v-card class="mode-tab-card mb-4">
          <v-tabs
            v-model="currentMode"
            color="primary"
            align-tabs="center"
            show-arrows
            class="mode-tabs"
            @update:model-value="handleModeChange"
          >
            <v-tab value="RANK" class="custom-tab">
              <v-icon :start="$vuetify.display.smAndUp">mdi-crown</v-icon>
              <span class="d-none d-sm-inline">ランク</span>
              <v-chip class="ml-1 ml-sm-2" size="small" color="primary">
                {{ rankDuels.length }}
              </v-chip>
            </v-tab>
            <v-tab value="RATE" class="custom-tab">
              <v-icon :start="$vuetify.display.smAndUp">mdi-chart-line</v-icon>
              <span class="d-none d-sm-inline">レート</span>
              <v-chip class="ml-1 ml-sm-2" size="small" color="info">
                {{ rateDuels.length }}
              </v-chip>
            </v-tab>
            <v-tab value="EVENT" class="custom-tab">
              <v-icon :start="$vuetify.display.smAndUp">mdi-calendar-star</v-icon>
              <span class="d-none d-sm-inline">イベント</span>
              <v-chip class="ml-1 ml-sm-2" size="small" color="secondary">
                {{ eventDuels.length }}
              </v-chip>
            </v-tab>
            <v-tab value="DC" class="custom-tab">
              <v-icon :start="$vuetify.display.smAndUp">mdi-trophy-variant</v-icon>
              <span class="d-none d-sm-inline">DC</span>
              <v-chip class="ml-1 ml-sm-2" size="small" color="warning">
                {{ dcDuels.length }}
              </v-chip>
            </v-tab>
          </v-tabs>
        </v-card>

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
              @update:model-value="fetchDuels"
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
              @update:model-value="fetchDuels"
            ></v-select>
          </v-col>
        </v-row>

        <!-- 統計カード -->
        <v-row class="mb-4">
          <v-col cols="6" sm="4" md="2">
            <stat-card
              title="総試合数"
              :value="currentStats.total_duels"
              icon="mdi-sword-cross"
              color="primary"
            />
          </v-col>
          <v-col cols="6" sm="4" md="2">
            <stat-card
              title="勝率"
              :value="`${(currentStats.win_rate * 100).toFixed(1)}%`"
              icon="mdi-trophy"
              color="success"
            />
          </v-col>
          <v-col cols="6" sm="4" md="2">
            <stat-card
              title="先攻勝率"
              :value="`${(currentStats.first_turn_win_rate * 100).toFixed(1)}%`"
              icon="mdi-lightning-bolt"
              color="warning"
            />
          </v-col>
          <v-col cols="6" sm="4" md="2">
            <stat-card
              title="後攻勝率"
              :value="`${(currentStats.second_turn_win_rate * 100).toFixed(1)}%`"
              icon="mdi-shield"
              color="secondary"
            />
          </v-col>
          <v-col cols="6" sm="4" md="2">
            <stat-card
              title="コイン勝率"
              :value="`${(currentStats.coin_win_rate * 100).toFixed(1)}%`"
              icon="mdi-poker-chip"
              color="yellow"
            />
          </v-col>
          <v-col cols="6" sm="4" md="2">
            <stat-card
              title="先攻率"
              :value="`${(currentStats.go_first_rate * 100).toFixed(1)}%`"
              icon="mdi-arrow-up-bold-hexagon-outline"
              color="teal"
            />
          </v-col>
        </v-row>

        <!-- デュエルテーブル -->
        <v-card class="duel-card">
          <v-card-title class="pa-4">
            <div class="d-flex align-center mb-3">
              <v-icon class="mr-2" color="primary">mdi-table</v-icon>
              <span class="text-h6">対戦履歴</span>
            </div>

            <!-- スマホ用: 縦並びボタン -->
            <div class="d-flex d-sm-none flex-column ga-2">
              <v-btn
                color="primary"
                prepend-icon="mdi-plus"
                block
                size="large"
                @click="openDuelDialog"
              >
                対戦記録を追加
              </v-btn>
              <div class="d-flex ga-2">
                <v-btn
                  color="secondary"
                  prepend-icon="mdi-download"
                  size="small"
                  class="flex-grow-1"
                  @click="exportCSV"
                >
                  エクスポート
                </v-btn>
                <v-btn
                  color="success"
                  prepend-icon="mdi-upload"
                  size="small"
                  class="flex-grow-1"
                  @click="triggerFileInput"
                >
                  インポート
                </v-btn>
                <v-btn
                  color="info"
                  prepend-icon="mdi-share-variant"
                  size="small"
                  class="flex-grow-1"
                  @click="shareDialogOpened = true"
                >
                  共有
                </v-btn>
              </div>
            </div>

            <!-- PC用: 横並びボタン -->
            <div class="d-none d-sm-flex align-center ga-2">
              <v-spacer />
              <v-btn color="secondary" prepend-icon="mdi-download" @click="exportCSV">
                CSVエクスポート
              </v-btn>
              <v-btn color="success" prepend-icon="mdi-upload" @click="triggerFileInput">
                CSVインポート
              </v-btn>
              <v-btn
                color="info"
                prepend-icon="mdi-share-variant"
                @click="shareDialogOpened = true"
              >
                共有リンクを生成
              </v-btn>
              <v-btn
                color="primary"
                prepend-icon="mdi-plus"
                class="add-btn"
                @click="openDuelDialog"
              >
                対戦記録を追加
              </v-btn>
            </div>

            <input
              ref="fileInput"
              type="file"
              accept=".csv"
              style="display: none"
              @change="handleFileUpload"
            />
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

    <!-- 共有リンク生成ダイアログ -->
    <share-stats-dialog
      v-model="shareDialogOpened"
      :initial-year="selectedYear"
      :initial-month="selectedMonth"
      :initial-game-mode="currentMode"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { api } from '@/services/api';
import { Duel, DuelStats, Deck, GameMode } from '@/types';
import StatCard from '@/components/duel/StatCard.vue';
import DuelTable from '@/components/duel/DuelTable.vue';
import DuelFormDialog from '@/components/duel/DuelFormDialog.vue';
import AppBar from '@/components/layout/AppBar.vue';
import ShareStatsDialog from '@/components/common/ShareStatsDialog.vue'; // Import the new component
import { useNotificationStore } from '@/stores/notification';

const drawer = ref(false);
const navItems = [
  { name: 'ダッシュボード', path: '/', view: 'dashboard', icon: 'mdi-view-dashboard' },
  { name: 'デッキ管理', path: '/decks', view: 'decks', icon: 'mdi-cards' },
  { name: '統計', path: '/statistics', view: 'statistics', icon: 'mdi-chart-bar' },
];

const notificationStore = useNotificationStore();

const duels = ref<Duel[]>([]);
const loading = ref(false);
const dialogOpen = ref(false);
const selectedDuel = ref<Duel | null>(null);
const decks = ref<Deck[]>([]);
const currentMode = ref<GameMode>('RANK');
const shareDialogOpened = ref(false); // New ref for ShareStatsDialog

// 年月選択関連
const selectedYear = ref(new Date().getFullYear());
const selectedMonth = ref(new Date().getMonth() + 1);
const years = computed(() => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => currentYear - i); // 過去5年
});
const months = Array.from({ length: 12 }, (_, i) => i + 1);

// ゲームモード別にデュエルをフィルタリング
const rankDuels = computed(() => duels.value.filter((d) => d.game_mode === 'RANK'));
const rateDuels = computed(() => duels.value.filter((d) => d.game_mode === 'RATE'));
const eventDuels = computed(() => duels.value.filter((d) => d.game_mode === 'EVENT'));
const dcDuels = computed(() => duels.value.filter((d) => d.game_mode === 'DC'));

const currentDuels = computed(() => {
  switch (currentMode.value) {
    case 'RANK':
      return rankDuels.value;
    case 'RATE':
      return rateDuels.value;
    case 'EVENT':
      return eventDuels.value;
    case 'DC':
      return dcDuels.value;
    default:
      return [];
  }
});

const emptyStats = (): DuelStats => ({
  total_duels: 0,
  win_count: 0,
  lose_count: 0,
  win_rate: 0,
  first_turn_win_rate: 0,
  second_turn_win_rate: 0,
  coin_win_rate: 0,
  go_first_rate: 0,
});

const rankStats = ref<DuelStats>(emptyStats());
const rateStats = ref<DuelStats>(emptyStats());
const eventStats = ref<DuelStats>(emptyStats());
const dcStats = ref<DuelStats>(emptyStats());

const currentStats = computed(() => {
  switch (currentMode.value) {
    case 'RANK':
      return rankStats.value;
    case 'RATE':
      return rateStats.value;
    case 'EVENT':
      return eventStats.value;
    case 'DC':
      return dcStats.value;
    default:
      return emptyStats();
  }
});

const fetchDuels = async () => {
  loading.value = true;
  try {
    // デッキ情報を先に取得
    const decksResponse = await api.get('/decks/');
    decks.value = decksResponse.data;

    // デュエル情報を取得
    const duelsResponse = await api.get('/duels/', {
      params: {
        year: selectedYear.value,
        month: selectedMonth.value,
      },
    });
    duels.value = duelsResponse.data.map((duel: Duel) => ({
      ...duel,
      deck: decks.value.find((d) => d.id === duel.deck_id),
      opponentdeck: decks.value.find((d) => d.id === duel.opponentDeck_id),
    }));

    // 各モードの統計を計算
    rankStats.value = calculateStats(rankDuels.value);
    rateStats.value = calculateStats(rateDuels.value);
    eventStats.value = calculateStats(eventDuels.value);
    dcStats.value = calculateStats(dcDuels.value);
  } catch (error) {
    console.error('Failed to fetch duels:', error);
  } finally {
    loading.value = false;
  }
};

const calculateStats = (duelList: Duel[]): DuelStats => {
  const total = duelList.length;
  if (total === 0) {
    return emptyStats();
  }

  const wins = duelList.filter((d) => d.result === true).length;
  const coinWins = duelList.filter((d) => d.coin === true).length;
  const firstTurnTotal = duelList.filter((d) => d.first_or_second === true).length;
  const firstTurnWins = duelList.filter(
    (d) => d.result === true && d.first_or_second === true,
  ).length;
  const secondTurnTotal = duelList.filter((d) => d.first_or_second === false).length;
  const secondTurnWins = duelList.filter(
    (d) => d.result === true && d.first_or_second === false,
  ).length;

  return {
    total_duels: total,
    win_count: wins,
    lose_count: total - wins,
    win_rate: wins / total,
    coin_win_rate: coinWins / total,
    go_first_rate: firstTurnTotal / total,
    first_turn_win_rate: firstTurnTotal > 0 ? firstTurnWins / firstTurnTotal : 0,
    second_turn_win_rate: secondTurnTotal > 0 ? secondTurnWins / secondTurnTotal : 0,
  };
};

const handleModeChange = (mode: any) => {
  currentMode.value = mode as GameMode;
};

const openDuelDialog = () => {
  selectedDuel.value = null;
  dialogOpen.value = true;
};

const editDuel = (duel: Duel) => {
  selectedDuel.value = duel;
  dialogOpen.value = true;
};

const deleteDuel = async (duelId: number) => {
  if (!confirm('この対戦記録を削除しますか？')) return;

  try {
    await api.delete(`/duels/${duelId}`);
    await fetchDuels();
    notificationStore.success('対戦記録を削除しました');
  } catch (error) {
    // エラーはAPIインターセプターで処理される
    console.error('Failed to delete duel:', error);
  }
};

const handleSaved = () => {
  dialogOpen.value = false;
  fetchDuels();
};

const fileInput = ref<HTMLInputElement | null>(null);

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);

  loading.value = true;
  try {
    const response = await api.post('/duels/import/csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const { created, errors } = response.data;

    if (errors && errors.length > 0) {
      notificationStore.error('CSVのインポート中にエラーが発生しました。');
      console.error('CSV Import Errors:', errors);
    } else {
      notificationStore.success(`${created}件の対戦記録をインポートしました`);
    }

    await fetchDuels();
  } catch (error) {
    console.error('Failed to import CSV:', error);
    // エラーはAPIインターセプターで処理される
  } finally {
    loading.value = false;
    // 同じファイルを再度選択できるように、inputの値をクリア
    if (fileInput.value) {
      fileInput.value.value = '';
    }
  }
};

const exportCSV = async () => {
  notificationStore.success('CSVファイルを生成しています... ダウンロードが開始されます。');

  const columns = [
    'deck_name',
    'opponent_deck_name',
    'result',
    'coin',
    'first_or_second',
    'rank',
    'rate_value',
    'dc_value',
    'notes',
    'played_date',
  ];

  try {
    const response = await api.get('/duels/export/csv', {
      params: {
        year: selectedYear.value,
        month: selectedMonth.value,
        game_mode: currentMode.value,
        columns: columns.join(','),
      },
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `duels_${selectedYear.value}_${selectedMonth.value}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('CSVエクスポートに失敗しました:', error);
    // エラー通知はインターセプターで処理される想定
  }
};

onMounted(() => {
  fetchDuels();
});

// Expose for testing
defineExpose({
  shareDialogOpened,
});
</script>

<style scoped lang="scss">
.main-content {
  min-height: 100vh;
}

.mode-tab-card {
  backdrop-filter: blur(10px);
  border: 1px solid rgba(128, 128, 128, 0.2);
  border-radius: 12px !important;
}

.duel-card {
  backdrop-filter: blur(10px);
  border: 1px solid rgba(128, 128, 128, 0.2);
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
  font-size: 1rem;
  padding: 0 24px;
  transition: background-color 0.3s ease;
  min-width: auto;

  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
}

// スマホ対応
@media (max-width: 599px) {
  .custom-tab {
    padding: 0 8px;
    font-size: 0.875rem;
    min-width: 60px;
  }

  .mode-tabs {
    :deep(.v-slide-group__content) {
      justify-content: space-between;
    }
  }
}
</style>
