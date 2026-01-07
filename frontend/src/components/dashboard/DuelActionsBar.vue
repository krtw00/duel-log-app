<template>
  <div>
    <!-- スマホ用: 縦並びボタン -->
    <div class="d-flex d-sm-none flex-column ga-2">
      <div class="default-toggle d-flex align-center ga-2">
        <v-tooltip text="新規追加時の初期値（先攻/後攻）" location="top">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              icon="mdi-tune-variant"
              variant="text"
              density="compact"
              class="default-toggle__icon"
            />
          </template>
        </v-tooltip>
        <v-btn-toggle
          :model-value="defaultFirstOrSecond"
          mandatory
          divided
          density="compact"
          variant="outlined"
          color="primary"
          selected-class="default-toggle__selected"
          class="default-toggle__toggle"
          @update:model-value="$emit('update:defaultFirstOrSecond', $event)"
        >
          <v-btn :value="0" size="small">後攻</v-btn>
          <v-btn :value="1" size="small">先攻</v-btn>
        </v-btn-toggle>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" block size="large" @click="$emit('add-duel')">
        対戦記録を追加
      </v-btn>
      <div class="d-flex ga-2">
        <v-btn
          color="secondary"
          prepend-icon="mdi-download"
          size="small"
          class="flex-grow-1"
          @click="$emit('export-csv')"
        >
          エクスポート
        </v-btn>
        <v-btn
          color="success"
          prepend-icon="mdi-upload"
          size="small"
          class="flex-grow-1"
          @click="$emit('import-csv')"
        >
          インポート
        </v-btn>
        <v-btn
          color="info"
          prepend-icon="mdi-share-variant"
          size="small"
          class="flex-grow-1"
          @click="$emit('share-data')"
        >
          共有
        </v-btn>
      </div>
    </div>

    <!-- PC用: 横並びボタン -->
    <div class="d-none d-sm-flex align-center ga-2">
      <v-spacer />
      <v-btn color="secondary" prepend-icon="mdi-download" @click="$emit('export-csv')">
        CSVエクスポート
      </v-btn>
      <v-btn color="success" prepend-icon="mdi-upload" @click="$emit('import-csv')">
        CSVインポート
      </v-btn>
      <v-btn color="info" prepend-icon="mdi-share-variant" @click="$emit('share-data')">
        共有リンクを生成
      </v-btn>
      <div class="default-toggle d-flex align-center ga-2">
        <v-tooltip text="新規追加時の初期値（先攻/後攻）" location="top">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              icon="mdi-tune-variant"
              variant="text"
              density="compact"
              class="default-toggle__icon"
            />
          </template>
        </v-tooltip>
        <v-btn-toggle
          :model-value="defaultFirstOrSecond"
          mandatory
          divided
          density="compact"
          variant="outlined"
          color="primary"
          selected-class="default-toggle__selected"
          class="default-toggle__toggle"
          @update:model-value="$emit('update:defaultFirstOrSecond', $event)"
        >
          <v-btn :value="0" size="small">後攻</v-btn>
          <v-btn :value="1" size="small">先攻</v-btn>
        </v-btn-toggle>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" class="add-btn" @click="$emit('add-duel')">
        対戦記録を追加
      </v-btn>
    </div>

    <input
      ref="fileInputRef"
      type="file"
      accept=".csv"
      style="display: none"
      @change="$emit('file-change', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const fileInputRef = ref<HTMLInputElement | null>(null);

withDefaults(
  defineProps<{
    defaultFirstOrSecond?: 0 | 1;
  }>(),
  {
    defaultFirstOrSecond: 1,
  },
);

defineEmits<{
  'add-duel': [];
  'export-csv': [];
  'import-csv': [];
  'share-data': [];
  'file-change': [event: Event];
  'update:defaultFirstOrSecond': [value: 0 | 1];
}>();

defineExpose({
  fileInputRef,
});
</script>

<style scoped>
.add-btn {
  font-weight: 600;
}

.default-toggle__icon {
  color: rgb(var(--v-theme-primary));
}

.default-toggle__toggle {
  border-width: 2px;
}

.default-toggle__selected {
  background: rgba(var(--v-theme-primary), 0.15) !important;
  border-color: rgb(var(--v-theme-primary)) !important;
}
</style>
