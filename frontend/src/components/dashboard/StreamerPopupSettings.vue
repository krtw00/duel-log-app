<template>
  <v-card class="streamer-popup-settings">
    <v-card-title class="pa-4">
      <div class="d-flex align-center">
        <v-icon class="mr-2" color="purple">mdi-monitor-cellphone</v-icon>
        <span class="text-h6">{{ LL?.obs.streamerPopup.title() }}</span>
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
            :label="LL?.obs.streamerPopup.gameMode()"
            variant="outlined"
            density="compact"
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-select
            v-model="statsPeriod"
            :items="statsPeriodOptions"
            :label="LL?.obs.streamerPopup.statsPeriod()"
            variant="outlined"
            density="compact"
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-select
            v-model="theme"
            :items="themeOptions"
            :label="LL?.obs.settings.theme()"
            variant="outlined"
            density="compact"
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-select
            v-model="layout"
            :items="layoutOptions"
            :label="LL?.obs.streamerPopup.layout()"
            variant="outlined"
            density="compact"
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-select
            v-model="chromaKeyBackground"
            :items="chromaKeyOptions"
            :label="LL?.obs.streamerPopup.chromaKey.title()"
            variant="outlined"
            density="compact"
            hide-details
          >
            <template #item="{ item, props }">
              <v-list-item v-bind="props">
                <template #prepend>
                  <v-icon
                    v-if="item.value !== 'none'"
                    :color="item.value === 'green' ? '#00FF00' : '#0000FF'"
                    size="small"
                    >mdi-square</v-icon
                  >
                </template>
              </v-list-item>
            </template>
          </v-select>
        </v-col>
      </v-row>

      <!-- 表示項目選択（折りたたみ式） -->
      <v-expansion-panels v-model="displayItemsPanel" class="mt-4">
        <v-expansion-panel value="items">
          <v-expansion-panel-title class="py-2">
            <div class="d-flex align-center">
              <v-icon size="small" class="mr-2" color="grey">mdi-checkbox-marked-outline</v-icon>
              <span class="text-body-2"
                >{{ LL?.obs.streamerPopup.displayItems() }}（{{
                  LL?.obs.streamerPopup.displayItemsCount({ count: selectedCount })
                }}）</span
              >
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
        {{ LL?.common.reset() }}
      </v-btn>
      <v-spacer />
      <v-btn
        variant="outlined"
        color="primary"
        prepend-icon="mdi-content-save"
        :disabled="!hasUnsavedChanges"
        @click="saveSettings"
      >
        {{ LL?.common.save() }}
        <template v-if="hasUnsavedChanges">
          <v-icon size="x-small" class="ml-1" color="warning">mdi-circle</v-icon>
        </template>
      </v-btn>
      <v-btn color="purple" variant="elevated" prepend-icon="mdi-open-in-new" @click="openPopup">
        {{ LL?.obs.streamerPopup.openPopup() }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useLocale } from '@/composables/useLocale';
import { useAuthStore, type ChromaKeyBackground } from '@/stores/auth';
import { createLogger } from '@/utils/logger';

const logger = createLogger('StreamerPopupSettings');
const { LL } = useLocale();
const authStore = useAuthStore();

const STORAGE_KEY = 'duellog.streamerPopupSettings';

// 保存済み設定のスナップショット（未保存変更の検出用）
interface SavedSettingsSnapshot {
  displayItems: { key: string; selected: boolean }[];
  gameMode: string;
  statsPeriod: string;
  theme: string;
  layout: string;
}
const savedSnapshot = ref<SavedSettingsSnapshot | null>(null);

interface DisplayItem {
  key: string;
  label: string;
  selected: boolean;
}

// 表示項目のキーと選択状態のみを保持（ラベルは動的に取得）
const displayItemKeys = [
  { key: 'current_deck', selected: false },
  { key: 'game_mode_value', selected: false },
  { key: 'total_duels', selected: false },
  { key: 'win_rate', selected: true },
  { key: 'first_turn_win_rate', selected: false },
  { key: 'second_turn_win_rate', selected: false },
  { key: 'coin_win_rate', selected: false },
  { key: 'go_first_rate', selected: false },
];

// キーからラベルを取得するマッピング
const getItemLabel = (key: string): string => {
  const labels: Record<string, () => string | undefined> = {
    current_deck: () => LL.value?.obs.streamerPopup.items.currentDeck(),
    game_mode_value: () => LL.value?.obs.streamerPopup.items.gameModeValue(),
    total_duels: () => LL.value?.obs.streamerPopup.items.totalDuels(),
    win_rate: () => LL.value?.obs.streamerPopup.items.winRate(),
    first_turn_win_rate: () => LL.value?.obs.streamerPopup.items.firstTurnWinRate(),
    second_turn_win_rate: () => LL.value?.obs.streamerPopup.items.secondTurnWinRate(),
    coin_win_rate: () => LL.value?.obs.streamerPopup.items.coinWinRate(),
    go_first_rate: () => LL.value?.obs.streamerPopup.items.goFirstRate(),
  };
  return labels[key]?.() ?? key;
};

// 初期表示項目の定義（ラベルを動的に生成）
const initialDisplayItems = computed<DisplayItem[]>(() =>
  displayItemKeys.map((item) => ({
    key: item.key,
    label: getItemLabel(item.key),
    selected: item.selected,
  })),
);

// デフォルト値
const defaultSettings = {
  gameMode: 'RANK',
  statsPeriod: 'monthly',
  theme: 'dark',
  layout: 'grid',
};

// 表示項目（順序と選択状態を保持）- ラベルは後で動的に更新
const displayItems = ref<DisplayItem[]>(
  displayItemKeys.map((item) => ({
    key: item.key,
    label: '',
    selected: item.selected,
  })),
);

// ラベルを最新の翻訳で更新
watch(
  () => LL.value,
  () => {
    displayItems.value = displayItems.value.map((item) => ({
      ...item,
      label: getItemLabel(item.key),
    }));
  },
  { immediate: true },
);
const gameMode = ref(defaultSettings.gameMode);
const statsPeriod = ref(defaultSettings.statsPeriod);
const theme = ref(defaultSettings.theme);
const layout = ref(defaultSettings.layout);

// クロマキー背景（authStoreと同期）
const chromaKeyBackground = ref<ChromaKeyBackground>(authStore.chromaKeyBackground);

// クロマキー背景の変更を監視してauthStoreに保存
watch(chromaKeyBackground, (newValue) => {
  authStore.setChromaKeyBackground(newValue);
});

// ドラッグ&ドロップの状態
const draggedIndex = ref<number | null>(null);
const dragOverIndex = ref<number | null>(null);

// 折りたたみパネルの状態
const displayItemsPanel = ref<string | undefined>(undefined);

// 選択中のアイテム数
const selectedCount = computed(() => displayItems.value.filter((item) => item.selected).length);

// 未保存の変更があるかどうか
const hasUnsavedChanges = computed(() => {
  if (!savedSnapshot.value) return false;

  const saved = savedSnapshot.value;

  // 基本設定の比較
  if (gameMode.value !== saved.gameMode) return true;
  if (statsPeriod.value !== saved.statsPeriod) return true;
  if (theme.value !== saved.theme) return true;
  if (layout.value !== saved.layout) return true;

  // 表示項目の比較（順序と選択状態）
  if (displayItems.value.length !== saved.displayItems.length) return true;
  for (let i = 0; i < displayItems.value.length; i++) {
    const current = displayItems.value[i];
    const savedItem = saved.displayItems[i];
    if (current.key !== savedItem.key || current.selected !== savedItem.selected) {
      return true;
    }
  }

  return false;
});

// オプション（国際化対応）
const gameModeOptions = computed(() => [
  { title: LL.value?.obs.streamerPopup.gameModes.rank() ?? 'Rank Match', value: 'RANK' },
  { title: LL.value?.obs.streamerPopup.gameModes.rate() ?? 'Rate Match', value: 'RATE' },
  { title: LL.value?.obs.streamerPopup.gameModes.event() ?? 'Event', value: 'EVENT' },
  { title: LL.value?.obs.streamerPopup.gameModes.dc() ?? 'Duelist Cup', value: 'DC' },
]);

const statsPeriodOptions = computed(() => [
  { title: LL.value?.obs.streamerPopup.statsPeriods.monthly() ?? 'This Month', value: 'monthly' },
  {
    title: LL.value?.obs.streamerPopup.statsPeriods.session() ?? 'Since Stream Start',
    value: 'session',
  },
]);

const themeOptions = computed(() => [
  { title: LL.value?.obs.settings.themeDark() ?? 'Dark', value: 'dark' },
  { title: LL.value?.obs.settings.themeLight() ?? 'Light', value: 'light' },
]);

const layoutOptions = computed(() => [
  { title: LL.value?.obs.streamerPopup.layouts.grid() ?? 'Grid', value: 'grid' },
  { title: LL.value?.obs.streamerPopup.layouts.horizontal() ?? 'Horizontal', value: 'horizontal' },
  { title: LL.value?.obs.streamerPopup.layouts.vertical() ?? 'Vertical', value: 'vertical' },
]);

// フォールバック用の固定更新間隔（BroadcastChannelが効かない場合用）
const FALLBACK_REFRESH_INTERVAL = 30000;

const chromaKeyOptions = computed(() => [
  { title: LL.value?.obs.streamerPopup.chromaKey.none() ?? 'Normal', value: 'none' },
  { title: LL.value?.obs.streamerPopup.chromaKey.green() ?? 'Green', value: 'green' },
  { title: LL.value?.obs.streamerPopup.chromaKey.blue() ?? 'Blue', value: 'blue' },
]);

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
      const template = initialDisplayItems.value.find((t) => t.key === saved.key);
      if (template) {
        newItems.push({ ...template, selected: saved.selected });
        usedKeys.add(saved.key);
      }
    }

    // 新しく追加された項目があれば末尾に追加
    for (const template of initialDisplayItems.value) {
      if (!usedKeys.has(template.key)) {
        newItems.push({ ...template });
      }
    }

    displayItems.value = newItems;
  }
};

/**
 * 現在の設定からスナップショットを作成
 */
const createSnapshot = (): SavedSettingsSnapshot => ({
  displayItems: displayItems.value.map((item) => ({ key: item.key, selected: item.selected })),
  gameMode: gameMode.value,
  statsPeriod: statsPeriod.value,
  theme: theme.value,
  layout: layout.value,
});

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
      if (settings.statsPeriod) {
        statsPeriod.value = settings.statsPeriod;
      }
      if (settings.theme) {
        theme.value = settings.theme;
      }
      if (settings.layout) {
        layout.value = settings.layout;
      }
    }
  } catch {
    // ストレージエラーは無視
  }

  // 読み込み後にスナップショットを作成（未保存変更の検出基準）
  savedSnapshot.value = createSnapshot();
};

/**
 * ローカルストレージに設定を保存する
 */
const saveSettings = () => {
  try {
    const settings = {
      displayItems: displayItems.value,
      gameMode: gameMode.value,
      statsPeriod: statsPeriod.value,
      theme: theme.value,
      layout: layout.value,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));

    // スナップショットを更新
    savedSnapshot.value = createSnapshot();

    logger.debug('Settings saved');
  } catch {
    // ストレージエラーは無視
  }
};

/**
 * デフォルト設定にリセットする
 */
const resetToDefaults = () => {
  displayItems.value = initialDisplayItems.value.map((item) => ({ ...item }));
  gameMode.value = defaultSettings.gameMode;
  statsPeriod.value = defaultSettings.statsPeriod;
  theme.value = defaultSettings.theme;
  layout.value = defaultSettings.layout;
};

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
    stats_period: statsPeriod.value,
    theme: theme.value,
    layout: layout.value,
    refresh: FALLBACK_REFRESH_INTERVAL.toString(),
  });
  return `${baseUrl}/streamer-popup?${params.toString()}`;
});

// ポップアップを開く（コンテンツに合わせて自動リサイズされる）
const openPopup = () => {
  // 未保存の変更があれば保存してから開く
  if (hasUnsavedChanges.value) {
    saveSettings();
  }

  let finalUrl = popupUrl.value;

  // セッション統計モードの場合、現在時刻の少し前をfrom_timestampとして渡す
  // （フォームが先に開かれている場合に対応するため1分前を基準にする）
  if (statsPeriod.value === 'session') {
    const urlObj = new URL(finalUrl, window.location.origin);
    const timestamp = new Date(Date.now() - 60 * 1000); // 1分前
    urlObj.searchParams.set('from_timestamp', timestamp.toISOString());
    finalUrl = urlObj.toString();

    logger.debug('Opening popup with from_timestamp:', timestamp.toISOString());
  }

  // レイアウトに応じたサイズを設定（カード幅200px基準）
  let width = 1200;
  let height = 120;
  if (layout.value === 'vertical') {
    width = 250;
    height = 600;
  } else if (layout.value === 'grid') {
    width = 900;
    height = 400;
  }
  window.open(
    finalUrl,
    'streamer-popup',
    `width=${width},height=${height},menubar=no,toolbar=no,resizable=yes`,
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
