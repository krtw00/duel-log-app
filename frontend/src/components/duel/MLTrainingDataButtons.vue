<template>
  <div class="debug-capture-buttons">
    <div class="debug-folder-row">
      <v-btn
        size="x-small"
        variant="tonal"
        :color="folderSelected ? 'success' : 'warning'"
        @click="$emit('select-folder')"
      >
        <v-icon start size="small">
          {{ folderSelected ? 'mdi-folder-check' : 'mdi-folder-open' }}
        </v-icon>
        {{ folderSelected ? 'フォルダ設定済' : '保存先を選択' }}
      </v-btn>
      <span v-if="!folderSelected" class="text-caption text-warning ml-2">
        ml-training/data を選択してください
      </span>
    </div>
    <div class="debug-buttons-row">
      <span class="text-caption mr-2">コイン:</span>
      <v-btn-group density="compact" variant="outlined" size="x-small">
        <v-btn color="primary" @click="$emit('save-image', 'coin-win')">勝</v-btn>
        <v-btn color="error" @click="$emit('save-image', 'coin-lose')">負</v-btn>
        <v-btn @click="$emit('save-image', 'coin-none')">なし</v-btn>
      </v-btn-group>
      <span class="text-caption mr-2 ml-3">勝敗:</span>
      <v-btn-group density="compact" variant="outlined" size="x-small">
        <v-btn color="success" @click="$emit('save-image', 'result-win')">勝</v-btn>
        <v-btn color="error" @click="$emit('save-image', 'result-lose')">負</v-btn>
        <v-btn @click="$emit('save-image', 'result-none')">なし</v-btn>
      </v-btn-group>
    </div>
  </div>
</template>

<script setup lang="ts">
export type DebugLabel =
  | 'coin-win'
  | 'coin-lose'
  | 'coin-none'
  | 'result-win'
  | 'result-lose'
  | 'result-none';

defineProps<{
  folderSelected: boolean;
}>();

defineEmits<{
  (e: 'select-folder'): void;
  (e: 'save-image', label: DebugLabel): void;
}>();
</script>

<style scoped lang="scss">
.debug-capture-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  background-color: rgba(255, 193, 7, 0.1);
  border: 1px dashed rgba(255, 193, 7, 0.5);
  border-radius: 4px;
  margin-top: 8px;
}

.debug-folder-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.debug-buttons-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
