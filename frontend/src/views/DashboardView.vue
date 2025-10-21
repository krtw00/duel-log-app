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

        <!-- 統計フィルター -->
        <v-card class="filter-card mb-4">
          <v-card-title class="pa-4">
            <div class="d-flex align-center">
              <v-icon class="mr-2" color="primary">mdi-filter</v-icon>
              <span class="text-h6">統計フィルター</span>
            </div>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-4">
            <v-row>
              <v-col cols="12" sm="6" md="4">
                <v-select
                  v-model="filterPeriodType"
                  :items="filterPeriodOptions"
                  label="期間"
                  variant="outlined"
                  density="compact"
                  hide-details
                  @update:model-value="applyFilters"
                ></v-select>
              </v-col>
              <v-col v-if="filterPeriodType === 'range'" cols="6" sm="3" md="2">
                <v-text-field
                  v-model.number="filterRangeStart"
                  label="開始（試合目）"
                  variant="outlined"
                  density="compact"
                  hide-details
                  type="number"
                  min="1"
                  @update:model-value="applyFilters"
                ></v-text-field>
              </v-col>
              <v-col v-if="filterPeriodType === 'range'" cols="6" sm="3" md="2">
                <v-text-field
                  v-model.number="filterRangeEnd"
                  label="終了（試合目）"
                  variant="outlined"
                  density="compact"
                  hide-details
                  type="number"
                  min="1"
                  @update:model-value="applyFilters"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6" md="4">
                <v-select
                  v-model="filterMyDeckId"
                  :items="availableMyDecks"
                  item-title="name"
                  item-value="id"
                  label="自分のデッキ"
                  variant="outlined"
                  density="compact"
                  hide-details
                  clearable
                  :disabled="availableMyDecks.length === 0"
                  @update:model-value="handleMyDeckFilterChange"
                ></v-select>
              </v-col>
              <v-col cols="12" sm="6" md="2" class="d-flex align-center">
                <v-btn
                  color="secondary"
                  variant="outlined"
                  block
                  @click="resetFilters"
                >
                  <v-icon start>mdi-refresh</v-icon>
                  リセット
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

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
              :color="coinWinRateColor"
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

        <!-- OBS連携カード（配信者モード時のみ表示） -->
        <v-row v-if="authStore.isStreamerModeEnabled" class="mb-4">
          <v-col cols="12">
            <v-card class="obs-card">
              <v-card-title class="d-flex align-center pa-4">
                <v-icon class="mr-2" color="primary">mdi-monitor-screenshot</v-icon>
                <span class="text-h6">OBS連携</span>
                <v-spacer />
                <v-btn
                  color="primary"
                  variant="elevated"
                  prepend-icon="mdi-open-in-new"
                  @click="showOBSDialog = true"
                >
                  URLを取得
                </v-btn>
              </v-card-title>
              <v-card-text class="pa-4">
                <p class="text-body-2 mb-3">
                  配信者モードが有効です。OBSのブラウザソースで直近の試合の統計情報をリアルタイム表示できます。
                </p>
                <div class="d-flex flex-wrap ga-2">
                  <v-chip color="success" variant="outlined" size="small">
                    <v-icon start size="small">mdi-trophy</v-icon>
                    勝率
                  </v-chip>
                  <v-chip color="warning" variant="outlined" size="small">
                    <v-icon start size="small">mdi-lightning-bolt</v-icon>
                    先行勝率
                  </v-chip>
                  <v-chip color="secondary" variant="outlined" size="small">
                    <v-icon start size="small">mdi-shield</v-icon>
                    後攻勝率
                  </v-chip>
                  <v-chip :color="coinWinRateColor" variant="outlined" size="small">
                    <v-icon start size="small">mdi-poker-chip</v-icon>
                    コイン勝率
                  </v-chip>
                  <v-chip color="teal" variant="outlined" size="small">
                    <v-icon start size="small">mdi-arrow-up-bold-hexagon-outline</v-icon>
                    先行率
                  </v-chip>
                </div>
              </v-card-text>
            </v-card>
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
            OBSのブラウザソースで統計情報をリアルタイムでオーバーレイ表示できます。表示する項目と集計期間をカスタマイズできます。
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

          <!-- 月間集計の場合 -->
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

          <!-- 直近N戦の場合 -->
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

          <!-- ゲームモード選択 -->
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

          <!-- レイアウト選択 -->
          <v-select
            v-model="obsLayout"
            :items="layoutOptions"
            label="レイアウト"
            variant="outlined"
            density="compact"
            hide-details
            class="mb-4"
          ></v-select>

          <!-- 表示項目選択 -->
          <v-card variant="outlined" class="mb-4">
            <v-card-title class="text-subtitle-2 pa-3">
              表示する項目を選択（ドラッグで並び替え可能）
            </v-card-title>
            <v-card-text class="pa-3">
              <div class="d-flex flex-column ga-2">
                <div
                  v-for="(item, index) in displayItems"
                  :key="item.value"
                  class="display-item"
                  :class="{ 'dragging': draggedIndex === index }"
                  draggable="true"
                  @dragstart="handleDragStart(index)"
                  @dragover.prevent="handleDragOver(index)"
                  @dragenter="handleDragEnter(index)"
                  @dragleave="handleDragLeave"
                  @drop="handleDrop(index)"
                  @dragend="handleDragEnd"
                >
                  <v-icon size="small" class="drag-handle mr-2">mdi-drag-vertical</v-icon>
                  <v-checkbox
                    v-model="item.selected"
                    :label="item.label"
                    density="compact"
                    hide-details
                    color="primary"
                    class="flex-grow-1"
                  ></v-checkbox>
                </div>
              </div>
            </v-card-text>
          </v-card>

          <!-- 更新間隔 -->
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
                <li>{{ recommendedSizeText }}</li>
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
import { Duel, DuelStats, Deck, GameMode } from '@/types';
import StatCard from '@/components/duel/StatCard.vue';
import DuelTable from '@/components/duel/DuelTable.vue';
import DuelFormDialog from '@/components/duel/DuelFormDialog.vue';
import AppBar from '@/components/layout/AppBar.vue';
import ShareStatsDialog from '@/components/common/ShareStatsDialog.vue'; // Import the new component
import { useNotificationStore } from '@/stores/notification';
import { useAuthStore } from '@/stores/auth';
import { useThemeStore } from '@/stores/theme';

const drawer = ref(false);
const navItems = [
  { name: 'ダッシュボード', path: '/', view: 'dashboard', icon: 'mdi-view-dashboard' },
  { name: 'デッキ管理', path: '/decks', view: 'decks', icon: 'mdi-cards' },
  { name: '統計', path: '/statistics', view: 'statistics', icon: 'mdi-chart-bar' },
];

const notificationStore = useNotificationStore();
const authStore = useAuthStore();
const themeStore = useThemeStore();

// コイン勝率の色（ダークモード時は黄色、ライトモード時は黒）
const coinWinRateColor = computed(() => {
  return themeStore.isDark ? 'yellow' : 'black';
});

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

// 統計フィルター関連
const filterPeriodType = ref<'all' | 'range'>('all');
const filterRangeStart = ref(1);
const filterRangeEnd = ref(30);
const filterMyDeckId = ref<number | null>(null);

const filterPeriodOptions = [
  { title: '全体', value: 'all' },
  { title: '範囲指定', value: 'range' },
];

type DeckOption = { id: number; name: string };
const availableDecksByMode = ref<Record<GameMode, DeckOption[]>>({
  RANK: [],
  RATE: [],
  EVENT: [],
  DC: [],
});

const availableMyDecks = computed(() => availableDecksByMode.value[currentMode.value] || []);

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

// 範囲フィルターのみを適用
const getRangeFilteredDuels = (duelList: Duel[]): Duel[] => {
  const sorted = [...duelList].sort(
    (a, b) => new Date(b.played_date).getTime() - new Date(a.played_date).getTime(),
  );

  if (filterPeriodType.value === 'range') {
    const start = Math.max(0, (filterRangeStart.value || 1) - 1);
    const end = filterRangeEnd.value || sorted.length;
    return sorted.slice(start, end);
  }

  return sorted;
};

// 統計用にフィルタリングされたデュエル（期間＋デッキ）
const applyStatFilters = (duelList: Duel[]): Duel[] => {
  const ranged = getRangeFilteredDuels(duelList);
  if (filterMyDeckId.value !== null) {
    return ranged.filter((duel) => duel.deck_id === filterMyDeckId.value);
  }
  return ranged;
};

const filteredRankDuels = computed(() => applyStatFilters(rankDuels.value));
const filteredRateDuels = computed(() => applyStatFilters(rateDuels.value));
const filteredEventDuels = computed(() => applyStatFilters(eventDuels.value));
const filteredDcDuels = computed(() => applyStatFilters(dcDuels.value));

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

    applyFilters();
  } catch (error) {
    console.error('Failed to fetch duels:', error);
  } finally {
    loading.value = false;
  }
};

const updateAvailableDecks = () => {
  const modeMap: Record<GameMode, Duel[]> = {
    RANK: rankDuels.value,
    RATE: rateDuels.value,
    EVENT: eventDuels.value,
    DC: dcDuels.value,
  };

  const updated: Record<GameMode, DeckOption[]> = {
    RANK: [],
    RATE: [],
    EVENT: [],
    DC: [],
  };

  (Object.keys(modeMap) as GameMode[]).forEach((mode) => {
    const rangeFiltered = getRangeFilteredDuels(modeMap[mode]);
    const deckMap = new Map<number, DeckOption>();
    rangeFiltered.forEach((duel) => {
      if (duel.deck_id && duel.deck?.name) {
        deckMap.set(duel.deck_id, { id: duel.deck_id, name: duel.deck.name });
      }
    });
    updated[mode] = Array.from(deckMap.values());
  });

  availableDecksByMode.value = updated;

  const currentModeDecks = updated[currentMode.value] || [];
  if (
    filterMyDeckId.value !== null &&
    !currentModeDecks.some((deck) => deck.id === filterMyDeckId.value)
  ) {
    filterMyDeckId.value = null;
  }
};

const applyFilters = () => {
  updateAvailableDecks();

  rankStats.value = calculateStats(filteredRankDuels.value);
  rateStats.value = calculateStats(filteredRateDuels.value);
  eventStats.value = calculateStats(filteredEventDuels.value);
  dcStats.value = calculateStats(filteredDcDuels.value);
};

const handleMyDeckFilterChange = () => {
  applyFilters();
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

// フィルターをリセット
const resetFilters = () => {
  filterPeriodType.value = 'all';
  filterRangeStart.value = 1;
  filterRangeEnd.value = 30;
  filterMyDeckId.value = null;
  applyFilters();
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

// --- OBS連携 ---
const showOBSDialog = ref(false);
const obsPeriodType = ref<'all' | 'monthly' | 'recent'>('recent');
const obsYear = ref(new Date().getFullYear());
const obsMonth = ref(new Date().getMonth() + 1);
const obsLimit = ref(30);
const obsGameMode = ref<string | undefined>(undefined);
const obsLayout = ref<'grid' | 'horizontal' | 'vertical'>('grid');
const obsRefreshInterval = ref(30000);
const urlCopied = ref(false);

const periodTypeOptions = [
  { title: '全期間', value: 'all' },
  { title: '月間集計', value: 'monthly' },
  { title: '直近N戦', value: 'recent' },
];

const gameModeOptions = [
  { title: 'ランク', value: 'RANK' },
  { title: 'レート', value: 'RATE' },
  { title: 'イベント', value: 'EVENT' },
  { title: 'DC', value: 'DC' },
];

const layoutOptions = [
  { title: 'グリッド（自動）', value: 'grid' },
  { title: '横1列（右に伸ばす）', value: 'horizontal' },
  { title: '縦1列（下に伸ばす）', value: 'vertical' },
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

// ドラッグ&ドロップの状態管理
const draggedIndex = ref<number | null>(null);
const dragOverIndex = ref<number | null>(null);

const handleDragStart = (index: number) => {
  draggedIndex.value = index;
};

const handleDragOver = (index: number) => {
  if (draggedIndex.value === null || draggedIndex.value === index) return;
  dragOverIndex.value = index;
};

const handleDragEnter = (index: number) => {
  dragOverIndex.value = index;
};

const handleDragLeave = () => {
  dragOverIndex.value = null;
};

const handleDrop = (index: number) => {
  if (draggedIndex.value === null || draggedIndex.value === index) return;

  const items = [...displayItems.value];
  const draggedItem = items[draggedIndex.value];
  items.splice(draggedIndex.value, 1);
  items.splice(index, 0, draggedItem);
  displayItems.value = items;

  draggedIndex.value = null;
  dragOverIndex.value = null;
};

const handleDragEnd = () => {
  draggedIndex.value = null;
  dragOverIndex.value = null;
};

// レイアウトに応じた推奨サイズ
const recommendedSizeText = computed(() => {
  switch (obsLayout.value) {
    case 'horizontal':
      return '幅: 1920px、高さ: 200px を推奨（下部に配置）';
    case 'vertical':
      return '幅: 250px、高さ: 1080px を推奨（右端に配置）';
    case 'grid':
    default:
      return '幅: 800px、高さ: 600px を推奨';
  }
});

const obsUrl = computed(() => {
  const baseUrl = window.location.origin;
  // localStorageから直接トークンを取得
  const accessToken = localStorage.getItem('access_token') || '';

  console.log('[Dashboard] Generating OBS URL');
  console.log('[Dashboard] Access token exists:', !!accessToken);
  console.log('[Dashboard] Token length:', accessToken.length);
  if (accessToken) {
    console.log('[Dashboard] Token preview:', accessToken.substring(0, 20) + '...');
  }

  const params = new URLSearchParams({
    token: accessToken,
    period_type: obsPeriodType.value,
    refresh: obsRefreshInterval.value.toString(),
  });

  // 集計期間に応じたパラメータ追加
  if (obsPeriodType.value === 'monthly') {
    params.append('year', obsYear.value.toString());
    params.append('month', obsMonth.value.toString());
  } else if (obsPeriodType.value === 'recent') {
    params.append('limit', obsLimit.value.toString());
  }

  // ゲームモード
  if (obsGameMode.value) {
    params.append('game_mode', obsGameMode.value);
  }

  // 表示項目
  const selectedItems = displayItems.value
    .filter(item => item.selected)
    .map(item => item.value)
    .join(',');
  if (selectedItems) {
    params.append('display_items', selectedItems);
  }

  // レイアウト
  params.append('layout', obsLayout.value);

  const url = `${baseUrl}/obs-overlay?${params.toString()}`;
  console.log('[Dashboard] Generated URL (without token):', url.replace(/token=[^&]*/, 'token=***'));

  return url;
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

watch(currentMode, () => {
  applyFilters();
});

onMounted(() => {
  fetchDuels();
});

// Expose for testing
defineExpose({
  shareDialogOpened,
  rankStats,
  availableMyDecks,
  filterMyDeckId,
  handleMyDeckFilterChange,
  handleModeChange,
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

.filter-card {
  backdrop-filter: blur(10px);
  border: 1px solid rgba(128, 128, 128, 0.2);
  border-radius: 12px !important;
}

.duel-card {
  backdrop-filter: blur(10px);
  border: 1px solid rgba(128, 128, 128, 0.2);
  border-radius: 12px !important;
}

.obs-card {
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 217, 255, 0.3);
  border-radius: 12px !important;
  background: linear-gradient(135deg, rgba(0, 217, 255, 0.05) 0%, rgba(181, 54, 255, 0.05) 100%);
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

// ドラッグ&ドロップスタイル
.display-item {
  display: flex;
  align-items: center;
  padding: 8px;
  border-radius: 4px;
  cursor: move;
  transition: all 0.2s ease;
  background-color: rgba(128, 128, 128, 0.05);

  &:hover {
    background-color: rgba(0, 217, 255, 0.1);
  }

  &.dragging {
    opacity: 0.5;
  }

  .drag-handle {
    cursor: grab;
    color: rgba(128, 128, 128, 0.5);
    transition: color 0.2s ease;

    &:hover {
      color: rgba(0, 217, 255, 0.8);
    }

    &:active {
      cursor: grabbing;
    }
  }
}
</style>
