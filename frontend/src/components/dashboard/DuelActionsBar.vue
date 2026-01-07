<template>
  <div>
    <!-- スマホ用: 縦並びボタン -->
    <div class="d-flex d-sm-none flex-column ga-2">
      <v-btn color="primary" prepend-icon="mdi-plus" block size="large" @click="$emit('add-duel')">
        対戦記録を追加
      </v-btn>
      <v-switch
        :model-value="defaultCoin === 1"
        class="coin-default-switch"
        color="warning"
        inset
        density="compact"
        hide-details
        label="コイン初期値: 表"
        @update:model-value="$emit('update:defaultCoin', $event ? 1 : 0)"
      />
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
      <v-switch
        :model-value="defaultCoin === 1"
        class="coin-default-switch"
        color="warning"
        inset
        density="compact"
        hide-details
        label="表"
        @update:model-value="$emit('update:defaultCoin', $event ? 1 : 0)"
      />
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
    defaultCoin?: 0 | 1;
  }>(),
  {
    defaultCoin: 1,
  },
);

defineEmits<{
  'add-duel': [];
  'export-csv': [];
  'import-csv': [];
  'share-data': [];
  'file-change': [event: Event];
  'update:defaultCoin': [value: 0 | 1];
}>();

defineExpose({
  fileInputRef,
});
</script>

<style scoped>
.add-btn {
  font-weight: 600;
}

.coin-default-switch {
  max-width: 140px;
}
</style>
