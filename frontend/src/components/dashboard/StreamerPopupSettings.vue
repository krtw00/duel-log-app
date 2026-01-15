<template>
  <v-card class="streamer-popup-settings">
    <v-card-title class="pa-4">
      <div class="d-flex align-center">
        <v-icon class="mr-2" color="purple">mdi-monitor-cellphone</v-icon>
        <span class="text-h6">配信用ポップアップ設定</span>
      </div>
    </v-card-title>
    <v-divider />
    <v-card-text class="pa-4">
      <!-- 基本設定 -->
      <v-row>
        <v-col cols="12" sm="6" md="3">
          <v-select
            v-model="gameMode"
            :items="gameModeOptions"
            label="ゲームモード"
            variant="outlined"
            density="compact"
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-select
            v-model="theme"
            :items="themeOptions"
            label="テーマ"
            variant="outlined"
            density="compact"
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-select
            v-model="windowSize"
            :items="windowSizeOptions"
            label="ウィンドウサイズ"
            variant="outlined"
            density="compact"
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-select
            v-model="refreshInterval"
            :items="refreshOptions"
            label="自動更新間隔"
            variant="outlined"
            density="compact"
            hide-details
          />
        </v-col>
      </v-row>

      <!-- 表示項目選択 -->
      <div class="mt-4">
        <div class="d-flex align-center mb-3">
          <v-icon size="small" class="mr-2" color="grey">mdi-checkbox-marked-outline</v-icon>
          <span class="text-subtitle-2 text-medium-emphasis">表示項目</span>
        </div>
        <v-row dense>
          <v-col v-for="item in availableItems" :key="item.key" cols="6" sm="4" md="3">
            <v-checkbox
              v-model="selectedItems"
              :label="item.label"
              :value="item.key"
              density="compact"
              hide-details
              color="purple"
            />
          </v-col>
        </v-row>
      </div>

      <!-- 対戦履歴件数（履歴が選択されている場合のみ表示） -->
      <v-expand-transition>
        <div v-if="selectedItems.includes('history')" class="mt-4">
          <div class="d-flex align-center mb-2">
            <v-icon size="small" class="mr-2" color="grey">mdi-history</v-icon>
            <span class="text-subtitle-2 text-medium-emphasis">対戦履歴件数: {{ historyLimit }}件</span>
          </div>
          <v-slider
            v-model="historyLimit"
            :min="1"
            :max="10"
            :step="1"
            thumb-label
            hide-details
            color="purple"
            track-color="grey-lighten-2"
          />
        </div>
      </v-expand-transition>
    </v-card-text>

    <v-divider />
    <v-card-actions class="pa-4">
      <v-btn variant="text" color="grey" prepend-icon="mdi-refresh" @click="resetToDefaults">
        リセット
      </v-btn>
      <v-spacer />
      <v-btn color="purple" variant="elevated" prepend-icon="mdi-open-in-new" @click="openPopup">
        ポップアップを開く
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';

const STORAGE_KEY = 'duellog.streamerPopupSettings';

// 表示可能な項目
const availableItems = [
  { key: 'current_deck', label: '使用デッキ' },
  { key: 'current_rank', label: 'ランク' },
  { key: 'current_rate', label: 'レート' },
  { key: 'current_dc', label: 'DC値' },
  { key: 'total_duels', label: '総試合数' },
  { key: 'win_rate', label: '勝率' },
  { key: 'first_turn_win_rate', label: '先攻勝率' },
  { key: 'second_turn_win_rate', label: '後攻勝率' },
  { key: 'coin_win_rate', label: 'コイン勝率' },
  { key: 'go_first_rate', label: '先攻率' },
  { key: 'history', label: '対戦履歴' },
];

// デフォルト値
const defaultSettings = {
  selectedItems: ['win_rate', 'total_duels'],
  gameMode: 'RANK',
  theme: 'dark',
  windowSize: 'auto',
  historyLimit: 5,
  refreshInterval: 30000,
};

// 選択状態
const selectedItems = ref<string[]>([...defaultSettings.selectedItems]);
const gameMode = ref(defaultSettings.gameMode);
const theme = ref(defaultSettings.theme);
const windowSize = ref(defaultSettings.windowSize);
const historyLimit = ref(defaultSettings.historyLimit);
const refreshInterval = ref(defaultSettings.refreshInterval);

// オプション
const gameModeOptions = [
  { title: 'ランクマッチ', value: 'RANK' },
  { title: 'レートマッチ', value: 'RATE' },
  { title: 'イベント', value: 'EVENT' },
  { title: 'デュエリストカップ', value: 'DC' },
];

const themeOptions = [
  { title: 'ダーク', value: 'dark' },
  { title: 'ライト', value: 'light' },
];

const windowSizeOptions = [
  { title: '自動（コンテンツに合わせる）', value: 'auto' },
  { title: '小（300x400）', value: 'small' },
  { title: '中（450x600）', value: 'medium' },
  { title: '大（600x800）', value: 'large' },
];

const refreshOptions = [
  { title: '10秒', value: 10000 },
  { title: '30秒', value: 30000 },
  { title: '1分', value: 60000 },
  { title: '5分', value: 300000 },
];

/**
 * ローカルストレージから設定を読み込む
 */
const loadSettings = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const settings = JSON.parse(stored);
      if (Array.isArray(settings.selectedItems)) {
        selectedItems.value = settings.selectedItems;
      }
      if (settings.gameMode) {
        gameMode.value = settings.gameMode;
      }
      if (settings.theme) {
        theme.value = settings.theme;
      }
      if (settings.windowSize) {
        windowSize.value = settings.windowSize;
      }
      if (typeof settings.historyLimit === 'number') {
        historyLimit.value = settings.historyLimit;
      }
      if (typeof settings.refreshInterval === 'number') {
        refreshInterval.value = settings.refreshInterval;
      }
    }
  } catch {
    // ストレージエラーは無視
  }
};

/**
 * ローカルストレージに設定を保存する
 */
const saveSettings = () => {
  try {
    const settings = {
      selectedItems: selectedItems.value,
      gameMode: gameMode.value,
      theme: theme.value,
      windowSize: windowSize.value,
      historyLimit: historyLimit.value,
      refreshInterval: refreshInterval.value,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ストレージエラーは無視
  }
};

/**
 * デフォルト設定にリセットする
 */
const resetToDefaults = () => {
  selectedItems.value = [...defaultSettings.selectedItems];
  gameMode.value = defaultSettings.gameMode;
  theme.value = defaultSettings.theme;
  windowSize.value = defaultSettings.windowSize;
  historyLimit.value = defaultSettings.historyLimit;
  refreshInterval.value = defaultSettings.refreshInterval;
};

// 設定変更時に自動保存
watch(
  [selectedItems, gameMode, theme, windowSize, historyLimit, refreshInterval],
  () => {
    saveSettings();
  },
  { deep: true },
);

// マウント時に設定を読み込む
onMounted(() => {
  loadSettings();
});

// ウィンドウサイズの計算
const getWindowDimensions = () => {
  const sizeMap: Record<string, { width: number; height: number }> = {
    small: { width: 300, height: 400 },
    medium: { width: 450, height: 600 },
    large: { width: 600, height: 800 },
    auto: { width: 400, height: 500 },
  };
  return sizeMap[windowSize.value] || sizeMap.auto;
};

// ポップアップURL生成
const popupUrl = computed(() => {
  const baseUrl = window.location.origin;
  const params = new URLSearchParams({
    items: selectedItems.value.join(','),
    game_mode: gameMode.value,
    theme: theme.value,
    window_size: windowSize.value,
    refresh: refreshInterval.value.toString(),
    history_limit: historyLimit.value.toString(),
  });
  return `${baseUrl}/streamer-popup?${params.toString()}`;
});

// ポップアップを開く
const openPopup = () => {
  const { width, height } = getWindowDimensions();
  window.open(
    popupUrl.value,
    'streamer-popup',
    `width=${width},height=${height},menubar=no,toolbar=no,resizable=yes`,
  );
};
</script>

<style scoped lang="scss">
.streamer-popup-settings {
  width: 100%;
}
</style>
