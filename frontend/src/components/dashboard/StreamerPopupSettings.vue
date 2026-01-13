<template>
  <v-card class="streamer-popup-settings">
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2" color="purple">mdi-monitor-cellphone</v-icon>
      配信用ポップアップ設定
    </v-card-title>

    <v-card-text>
      <p class="text-body-2 mb-4">
        OBSでウィンドウキャプチャして使用できるポップアップウィンドウを開きます。
        表示する項目を選択してください。
      </p>

      <!-- 表示項目選択 -->
      <div class="mb-4">
        <div class="text-subtitle-2 mb-2">表示項目</div>
        <v-row dense>
          <v-col v-for="item in availableItems" :key="item.key" cols="6" sm="4">
            <v-checkbox
              v-model="selectedItems"
              :label="item.label"
              :value="item.key"
              density="compact"
              hide-details
            />
          </v-col>
        </v-row>
      </div>

      <!-- ゲームモード選択 -->
      <div class="mb-4">
        <v-select
          v-model="gameMode"
          :items="gameModeOptions"
          label="ゲームモード"
          density="compact"
          hide-details
        />
      </div>

      <!-- レイアウト選択 -->
      <div class="mb-4">
        <v-select
          v-model="layout"
          :items="layoutOptions"
          label="レイアウト"
          density="compact"
          hide-details
        />
      </div>

      <!-- テーマ選択 -->
      <div class="mb-4">
        <v-select
          v-model="theme"
          :items="themeOptions"
          label="テーマ"
          density="compact"
          hide-details
        />
      </div>

      <!-- 対戦履歴件数 -->
      <div v-if="selectedItems.includes('history')" class="mb-4">
        <v-slider
          v-model="historyLimit"
          :min="1"
          :max="10"
          :step="1"
          label="対戦履歴件数"
          thumb-label
          hide-details
        />
      </div>

      <!-- 更新間隔 -->
      <div class="mb-4">
        <v-select
          v-model="refreshInterval"
          :items="refreshOptions"
          label="自動更新間隔"
          density="compact"
          hide-details
        />
      </div>

      <!-- 生成されたURL -->
      <div class="mb-4">
        <v-text-field
          v-model="popupUrl"
          label="ポップアップURL"
          readonly
          density="compact"
          hide-details
        >
          <template #append-inner>
            <v-btn icon="mdi-content-copy" size="small" variant="text" @click="copyUrl" />
          </template>
        </v-text-field>
      </div>
    </v-card-text>

    <v-card-actions>
      <v-spacer />
      <v-btn color="purple" variant="elevated" prepend-icon="mdi-open-in-new" @click="openPopup">
        ポップアップを開く
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useNotificationStore } from '@/stores/notification';

const notificationStore = useNotificationStore();

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

// 選択状態
const selectedItems = ref(['win_rate', 'total_duels']);
const gameMode = ref('RANK');
const layout = ref('vertical');
const theme = ref('dark');
const historyLimit = ref(5);
const refreshInterval = ref(30000);

// オプション
const gameModeOptions = [
  { title: 'ランクマッチ', value: 'RANK' },
  { title: 'レートマッチ', value: 'RATE' },
  { title: 'イベント', value: 'EVENT' },
  { title: 'デュエリストカップ', value: 'DC' },
];

const layoutOptions = [
  { title: '縦1列', value: 'vertical' },
  { title: '横1列', value: 'horizontal' },
  { title: 'グリッド', value: 'grid' },
];

const themeOptions = [
  { title: 'ダーク', value: 'dark' },
  { title: 'ライト', value: 'light' },
];

const refreshOptions = [
  { title: '10秒', value: 10000 },
  { title: '30秒', value: 30000 },
  { title: '1分', value: 60000 },
  { title: '5分', value: 300000 },
];

// ポップアップURL生成
const popupUrl = computed(() => {
  const baseUrl = window.location.origin;
  const params = new URLSearchParams({
    items: selectedItems.value.join(','),
    game_mode: gameMode.value,
    layout: layout.value,
    theme: theme.value,
    refresh: refreshInterval.value.toString(),
    history_limit: historyLimit.value.toString(),
  });
  return `${baseUrl}/streamer-popup?${params.toString()}`;
});

// URLをコピー
const copyUrl = async () => {
  try {
    await navigator.clipboard.writeText(popupUrl.value);
    notificationStore.success('URLをコピーしました');
  } catch {
    notificationStore.error('コピーに失敗しました');
  }
};

// ポップアップを開く
const openPopup = () => {
  window.open(popupUrl.value, 'streamer-popup', 'width=450,height=600,menubar=no,toolbar=no');
};
</script>

<style scoped lang="scss">
.streamer-popup-settings {
  margin-bottom: 16px;
}
</style>
