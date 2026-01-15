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

      <!-- 表示項目選択（折りたたみ式） -->
      <v-expansion-panels v-model="displayItemsPanel" class="mt-4">
        <v-expansion-panel value="items">
          <v-expansion-panel-title class="py-2">
            <div class="d-flex align-center">
              <v-icon size="small" class="mr-2" color="grey">mdi-checkbox-marked-outline</v-icon>
              <span class="text-body-2">表示項目（{{ selectedCount }}個選択中）</span>
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <div class="display-items-list">
              <div
                v-for="(item, index) in displayItems"
                :key="item.key"
                class="display-item-compact"
                :class="{ dragging: draggedIndex === index }"
                draggable="true"
                @dragstart="handleDragStart(index)"
                @dragover.prevent="handleDragOver(index)"
                @dragenter="handleDragEnter(index)"
                @dragleave="handleDragLeave"
                @drop="handleDrop(index)"
                @dragend="handleDragEnd"
              >
                <v-icon size="x-small" class="drag-handle-compact">mdi-drag-vertical</v-icon>
                <v-checkbox
                  v-model="item.selected"
                  :label="item.label"
                  density="compact"
                  hide-details
                  color="purple"
                  class="flex-grow-1 compact-checkbox"
                />
              </div>
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
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

interface DisplayItem {
  key: string;
  label: string;
  selected: boolean;
}

// 初期表示項目の定義
const initialDisplayItems: DisplayItem[] = [
  { key: 'current_deck', label: '使用デッキ', selected: false },
  { key: 'game_mode_value', label: 'ランク/レート/DC（ゲームモードに連動）', selected: false },
  { key: 'total_duels', label: '総試合数', selected: false },
  { key: 'win_rate', label: '勝率', selected: true },
  { key: 'first_turn_win_rate', label: '先攻勝率', selected: false },
  { key: 'second_turn_win_rate', label: '後攻勝率', selected: false },
  { key: 'coin_win_rate', label: 'コイン勝率', selected: false },
  { key: 'go_first_rate', label: '先攻率', selected: false },
];

// デフォルト値
const defaultSettings = {
  displayItems: initialDisplayItems.map((item) => ({ ...item })),
  gameMode: 'RANK',
  theme: 'dark',
  layout: 'grid',
  refreshInterval: 30000,
};

// 表示項目（順序と選択状態を保持）
const displayItems = ref<DisplayItem[]>(initialDisplayItems.map((item) => ({ ...item })));
const gameMode = ref(defaultSettings.gameMode);
const theme = ref(defaultSettings.theme);
const layout = ref(defaultSettings.layout);
const refreshInterval = ref(defaultSettings.refreshInterval);

// ドラッグ&ドロップの状態
const draggedIndex = ref<number | null>(null);
const dragOverIndex = ref<number | null>(null);

// 折りたたみパネルの状態
const displayItemsPanel = ref<string | undefined>(undefined);

// 選択中のアイテム数
const selectedCount = computed(() => displayItems.value.filter((item) => item.selected).length);

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
  { title: 'グリッド（自動調整）', value: 'grid' },
  { title: '横並び', value: 'horizontal' },
  { title: '縦並び', value: 'vertical' },
];

const refreshOptions = [
  { title: '10秒', value: 10000 },
  { title: '30秒', value: 30000 },
  { title: '1分', value: 60000 },
  { title: '5分', value: 300000 },
];

// ドラッグ&ドロップハンドラ
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

// 古い設定形式をマイグレーション
const migrateOldSettings = (settings: Record<string, unknown>): void => {
  // 旧形式: selectedItems が string[] の場合
  if (Array.isArray(settings.selectedItems) && typeof settings.selectedItems[0] === 'string') {
    const oldSelectedItems = settings.selectedItems as string[];
    const oldValueKeys = ['current_rank', 'current_rate', 'current_dc'];

    // game_mode_value へのマイグレーション
    let selectedKeys = oldSelectedItems.filter((key) => !oldValueKeys.includes(key));
    if (oldSelectedItems.some((key) => oldValueKeys.includes(key))) {
      if (!selectedKeys.includes('game_mode_value')) {
        const firstOldKeyIndex = oldSelectedItems.findIndex((key) => oldValueKeys.includes(key));
        selectedKeys.splice(Math.min(firstOldKeyIndex, selectedKeys.length), 0, 'game_mode_value');
      }
    }

    // displayItems を更新（選択状態のみ、順序は維持）
    displayItems.value = displayItems.value.map((item) => ({
      ...item,
      selected: selectedKeys.includes(item.key),
    }));
    return;
  }

  // 新形式: displayItems が配列の場合
  if (Array.isArray(settings.displayItems)) {
    const savedItems = settings.displayItems as DisplayItem[];
    // 保存されたアイテムの順序と選択状態を復元
    const newItems: DisplayItem[] = [];
    const usedKeys = new Set<string>();

    // 保存された順序で追加
    for (const saved of savedItems) {
      const template = initialDisplayItems.find((t) => t.key === saved.key);
      if (template) {
        newItems.push({ ...template, selected: saved.selected });
        usedKeys.add(saved.key);
      }
    }

    // 新しく追加された項目があれば末尾に追加
    for (const template of initialDisplayItems) {
      if (!usedKeys.has(template.key)) {
        newItems.push({ ...template });
      }
    }

    displayItems.value = newItems;
  }
};

/**
 * ローカルストレージから設定を読み込む
 */
const loadSettings = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const settings = JSON.parse(stored);
      migrateOldSettings(settings);

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
      displayItems: displayItems.value,
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
  displayItems.value = defaultSettings.displayItems.map((item) => ({ ...item }));
  gameMode.value = defaultSettings.gameMode;
  theme.value = defaultSettings.theme;
  layout.value = defaultSettings.layout;
  refreshInterval.value = defaultSettings.refreshInterval;
};

// 設定変更時に自動保存
watch(
  [displayItems, gameMode, theme, layout, refreshInterval],
  () => {
    saveSettings();
  },
  { deep: true },
);

// マウント時に設定を読み込む
onMounted(() => {
  loadSettings();
});

// 選択された項目のキーを順序通りに取得
const selectedItemKeys = computed(() => {
  return displayItems.value.filter((item) => item.selected).map((item) => item.key);
});

// ポップアップURL生成
const popupUrl = computed(() => {
  const baseUrl = window.location.origin;
  const params = new URLSearchParams({
    items: selectedItemKeys.value.join(','),
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

.display-items-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.display-item-compact {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: move;
  transition: background-color 0.15s;

  &:hover {
    background-color: rgba(128, 128, 128, 0.08);
  }

  &.dragging {
    opacity: 0.5;
  }
}

.drag-handle-compact {
  cursor: grab;
  color: rgba(128, 128, 128, 0.5);
  margin-right: 4px;

  &:active {
    cursor: grabbing;
  }
}

.compact-checkbox {
  :deep(.v-label) {
    font-size: 0.875rem;
  }
}
</style>
