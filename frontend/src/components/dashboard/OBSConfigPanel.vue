<template>
  <v-dialog :model-value="modelValue" max-width="700px" @update:model-value="$emit('update:modelValue', $event)">
    <v-card>
      <v-card-title class="d-flex align-center pa-4">
        <v-icon class="mr-2" color="primary">mdi-monitor-screenshot</v-icon>
        <span class="text-h5">OBS連携設定</span>
        <v-spacer />
        <v-btn icon variant="text" @click="$emit('update:modelValue', false)">
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
          :model-value="periodType"
          :items="periodTypeOptions"
          label="集計期間"
          variant="outlined"
          density="compact"
          hide-details
          class="mb-4"
          @update:model-value="$emit('update:periodType', $event)"
        ></v-select>

        <!-- 月間集計の場合 -->
        <v-row v-if="periodType === 'monthly'" class="mb-4">
          <v-col cols="6">
            <v-select
              :model-value="year"
              :items="years"
              label="年"
              variant="outlined"
              density="compact"
              hide-details
              @update:model-value="$emit('update:year', $event)"
            ></v-select>
          </v-col>
          <v-col cols="6">
            <v-select
              :model-value="month"
              :items="months"
              label="月"
              variant="outlined"
              density="compact"
              hide-details
              @update:model-value="$emit('update:month', $event)"
            ></v-select>
          </v-col>
        </v-row>

        <!-- 直近N戦の場合 -->
        <v-text-field
          v-if="periodType === 'recent'"
          :model-value="limit"
          label="表示する試合数"
          variant="outlined"
          density="compact"
          hide-details
          type="number"
          min="1"
          max="100"
          class="mb-4"
          @update:model-value="$emit('update:limit', Number($event))"
        ></v-text-field>

        <!-- ゲームモード選択 -->
        <v-select
          :model-value="gameMode"
          :items="gameModeOptions"
          label="ゲームモード（任意）"
          variant="outlined"
          density="compact"
          hide-details
          clearable
          class="mb-4"
          @update:model-value="$emit('update:gameMode', $event)"
        ></v-select>

        <!-- レイアウト選択 -->
        <v-select
          :model-value="layout"
          :items="layoutOptions"
          label="レイアウト"
          variant="outlined"
          density="compact"
          hide-details
          class="mb-4"
          @update:model-value="$emit('update:layout', $event)"
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
                @dragstart="$emit('drag-start', index)"
                @dragover.prevent="$emit('drag-over', index)"
                @dragenter="$emit('drag-enter', index)"
                @dragleave="$emit('drag-leave')"
                @drop="$emit('drop', index)"
                @dragend="$emit('drag-end')"
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
          :model-value="refreshInterval"
          label="更新間隔（ミリ秒）"
          variant="outlined"
          density="compact"
          hide-details
          type="number"
          class="mb-4"
          @update:model-value="$emit('update:refreshInterval', Number($event))"
        ></v-text-field>

        <v-alert type="info" variant="tonal" class="mb-4">
          <div class="text-body-2">
            <strong>OBSでの設定方法：</strong>
            <ol class="ml-4 mt-2">
              <li>OBSで「ソース」→「+」→「ブラウザ」を選択</li>
              <li>以下のURLをコピーして「URL」欄に貼り付け</li>
              <li>{{ recommendedSizeText }}</li>
              <li>
                「カスタムCSS」で背景を透過: <code>body { background-color: transparent; }</code>
              </li>
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
            <v-btn icon variant="text" size="small" @click="$emit('copy-url')">
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
        <v-btn color="primary" variant="elevated" @click="$emit('update:modelValue', false)">
          閉じる
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
interface DisplayItem {
  label: string;
  value: string;
  selected: boolean;
}

interface Props {
  modelValue: boolean;
  periodType: 'monthly' | 'recent';
  year: number;
  month: number;
  limit: number;
  gameMode: string | undefined;
  layout: 'grid' | 'horizontal' | 'vertical';
  refreshInterval: number;
  displayItems: DisplayItem[];
  draggedIndex: number | null;
  obsUrl: string;
  urlCopied: boolean;
  years: number[];
  months: number[];
  periodTypeOptions: Array<{ title: string; value: string }>;
  gameModeOptions: Array<{ title: string; value: string }>;
  layoutOptions: Array<{ title: string; value: string }>;
  recommendedSizeText: string;
}

defineProps<Props>();

defineEmits<{
  'update:modelValue': [value: boolean];
  'update:periodType': [value: 'monthly' | 'recent'];
  'update:year': [value: number];
  'update:month': [value: number];
  'update:limit': [value: number];
  'update:gameMode': [value: string | undefined];
  'update:layout': [value: 'grid' | 'horizontal' | 'vertical'];
  'update:refreshInterval': [value: number];
  'drag-start': [index: number];
  'drag-over': [index: number];
  'drag-enter': [index: number];
  'drag-leave': [];
  'drop': [index: number];
  'drag-end': [];
  'copy-url': [];
}>();
</script>

<style scoped>
.display-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border: 1px solid rgba(128, 128, 128, 0.2);
  border-radius: 8px;
  cursor: move;
  transition: all 0.2s;
}

.display-item:hover {
  background-color: rgba(128, 128, 128, 0.1);
}

.display-item.dragging {
  opacity: 0.5;
}

.drag-handle {
  cursor: grab;
  color: rgba(128, 128, 128, 0.6);
}

.drag-handle:active {
  cursor: grabbing;
}
</style>
