<template>
  <div>
    <!-- OBS連携カード -->
    <OBSInfoCard
      :streamer-mode-enabled="authStore.isStreamerModeEnabled"
      :coin-win-rate-color="coinWinRateColor"
      @open-settings="showOBSDialog = true"
    />

    <!-- OBS連携モーダル -->
    <OBSConfigPanel
      v-model="showOBSDialog"
      v-model:period-type="obsPeriodType"
      v-model:year="obsYear"
      v-model:month="obsMonth"
      v-model:limit="obsLimit"
      v-model:game-mode="obsGameMode"
      v-model:layout="obsLayout"
      v-model:theme="obsTheme"
      v-model:refresh-interval="obsRefreshInterval"
      :display-items="displayItems"
      :dragged-index="draggedIndex"
      :obs-url="obsUrl"
      :url-copied="urlCopied"
      :years="years"
      :months="months"
      :period-type-options="periodTypeOptions"
      :game-mode-options="gameModeOptions"
      :layout-options="layoutOptions"
      :theme-options="themeOptions"
      :recommended-size-text="recommendedSizeText"
      @drag-start="handleDragStart"
      @drag-over="handleDragOver"
      @drag-enter="handleDragEnter"
      @drag-leave="handleDragLeave"
      @drop="handleDrop"
      @drag-end="handleDragEnd"
      @copy-url="handleCopyUrl"
    />
  </div>
</template>

<script setup lang="ts">
// Components
import OBSInfoCard from '@/components/dashboard/OBSInfoCard.vue';
import OBSConfigPanel from '@/components/dashboard/OBSConfigPanel.vue';

// Stores
import { useAuthStore } from '@/stores/auth';

// Composables
import { useOBSConfiguration } from '@/composables/useOBSConfiguration';

// Stores
const authStore = useAuthStore();

const {
  showOBSDialog,
  obsPeriodType,
  obsYear,
  obsMonth,
  obsLimit,
  obsGameMode,
  obsLayout,
  obsTheme,
  obsRefreshInterval,
  displayItems,
  draggedIndex,
  urlCopied,
  years,
  months,
  periodTypeOptions,
  gameModeOptions,
  layoutOptions,
  themeOptions,
  recommendedSizeText,
  obsUrl,
  coinWinRateColor,
  handleDragStart,
  handleDragOver,
  handleDragEnter,
  handleDragLeave,
  handleDrop,
  handleDragEnd,
  copyOBSUrl,
  fetchLatestDuelId,
} = useOBSConfiguration();

// URLコピー時に最新のIDを取得してからコピー
const handleCopyUrl = async () => {
  await fetchLatestDuelId();
  await copyOBSUrl();
};
</script>
