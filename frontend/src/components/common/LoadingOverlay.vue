<template>
  <v-overlay
    :model-value="isLoading"
    class="loading-overlay"
    persistent
  >
    <div class="loading-content">
      <v-progress-circular
        indeterminate
        size="64"
        width="6"
        color="primary"
      />
      <p class="loading-text mt-4">読み込み中...</p>
    </div>
  </v-overlay>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useLoadingStore } from '../../stores/loading'

const loadingStore = useLoadingStore()
const { isLoading } = storeToRefs(loadingStore)
</script>

<style scoped lang="scss">
.loading-overlay {
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.loading-text {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1rem;
  font-weight: 500;
  letter-spacing: 0.5px;
}
</style>
