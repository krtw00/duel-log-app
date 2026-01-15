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
            v-model="layout"
            :items="layoutOptions"
            label="レイアウト"
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

    </v-card-text>

    <v-divider />
    <v-card-actions class="pa-4">
      <v-btn variant="outlined" color="warning" prepend-icon="mdi-refresh" @click="resetToDefaults">
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
];

// デフォルト値
const defaultSettings = {
  selectedItems: ['win_rate', 'total_duels'],
  gameMode: 'RANK',
  theme: 'dark',
  layout: 'horizontal',
  refreshInterval: 30000,
};

// 選択状態
const selectedItems = ref<string[]>([...defaultSettings.selectedItems]);
const gameMode = ref(defaultSettings.gameMode);
const theme = ref(defaultSettings.theme);
const layout = ref(defaultSettings.layout);
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

const layoutOptions = [
  { title: '横並び', value: 'horizontal' },
  { title: '縦並び', value: 'vertical' },
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
      if (settings.layout) {
        layout.value = settings.layout;
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
      layout: layout.value,
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
  layout.value = defaultSettings.layout;
  refreshInterval.value = defaultSettings.refreshInterval;
};

// 設定変更時に自動保存
watch(
  [selectedItems, gameMode, theme, layout, refreshInterval],
  () => {
    saveSettings();
  },
  { deep: true },
);

// マウント時に設定を読み込む
onMounted(() => {
  loadSettings();
});

// ポップアップURL生成
const popupUrl = computed(() => {
  const baseUrl = window.location.origin;
  const params = new URLSearchParams({
    items: selectedItems.value.join(','),
    game_mode: gameMode.value,
    theme: theme.value,
    layout: layout.value,
    refresh: refreshInterval.value.toString(),
  });
  return `${baseUrl}/streamer-popup?${params.toString()}`;
});

// ポップアップを開く（コンテンツに合わせて自動リサイズされる）
const openPopup = () => {
  // 初期サイズは大きめに設定し、コンテンツ読み込み後に自動調整される
  window.open(
    popupUrl.value,
    'streamer-popup',
    'width=600,height=500,menubar=no,toolbar=no,resizable=yes',
  );
};
</script>

<style scoped lang="scss">
.streamer-popup-settings {
  width: 100%;
}
</style>
