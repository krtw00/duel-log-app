<template>
  <v-row v-if="streamerModeEnabled" class="mb-4">
    <v-col cols="12">
      <v-expansion-panels v-model="expandedPanel">
        <!-- 新しいポップアップウィンドウ方式（推奨） -->
        <v-expansion-panel value="popup">
          <v-expansion-panel-title>
            <div class="d-flex align-center">
              <v-icon class="mr-2" color="purple">mdi-monitor-cellphone</v-icon>
              <span class="text-subtitle-1 font-weight-medium">{{
                LL?.dashboard.streamer.popupWindow()
              }}</span>
              <v-chip class="ml-2" color="success" size="x-small" variant="flat">{{
                LL?.dashboard.streamer.recommended()
              }}</v-chip>
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <StreamerPopupSettings />
          </v-expansion-panel-text>
        </v-expansion-panel>

        <!-- 従来のOBSオーバーレイ方式 -->
        <v-expansion-panel value="obs">
          <v-expansion-panel-title>
            <div class="d-flex align-center">
              <v-icon class="mr-2" color="primary">mdi-monitor-screenshot</v-icon>
              <span class="text-subtitle-1 font-weight-medium">{{
                LL?.dashboard.streamer.obsBrowserSource()
              }}</span>
              <v-chip class="ml-2" color="warning" size="x-small" variant="flat">{{
                LL?.dashboard.streamer.deprecated()
              }}</v-chip>
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-alert type="warning" variant="tonal" density="compact" class="mb-4">
              {{ LL?.dashboard.streamer.deprecationWarning() }}
            </v-alert>
            <p class="text-body-2 mb-3">
              {{ LL?.dashboard.streamer.obsDescription() }}
            </p>
            <div class="d-flex flex-wrap ga-2 mb-4">
              <v-chip color="success" variant="outlined" size="small">
                <v-icon start size="small">mdi-trophy</v-icon>
                {{ LL?.dashboard.streamer.winRate() }}
              </v-chip>
              <v-chip color="warning" variant="outlined" size="small">
                <v-icon start size="small">mdi-lightning-bolt</v-icon>
                {{ LL?.dashboard.streamer.firstWinRate() }}
              </v-chip>
              <v-chip color="secondary" variant="outlined" size="small">
                <v-icon start size="small">mdi-shield</v-icon>
                {{ LL?.dashboard.streamer.secondWinRate() }}
              </v-chip>
              <v-chip :color="coinWinRateColor" variant="outlined" size="small">
                <v-icon start size="small">mdi-poker-chip</v-icon>
                {{ LL?.dashboard.streamer.coinWinRate() }}
              </v-chip>
              <v-chip color="teal" variant="outlined" size="small">
                <v-icon start size="small">mdi-arrow-up-bold-hexagon-outline</v-icon>
                {{ LL?.dashboard.streamer.firstRate() }}
              </v-chip>
            </div>
            <v-btn
              color="primary"
              variant="elevated"
              prepend-icon="mdi-open-in-new"
              @click="showOBSDialog = true"
            >
              {{ LL?.dashboard.streamer.getObsUrl() }}
            </v-btn>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-col>

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
  </v-row>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import StreamerPopupSettings from './StreamerPopupSettings.vue';
import OBSConfigPanel from './OBSConfigPanel.vue';
import { useOBSConfiguration } from '@/composables/useOBSConfiguration';
import { useLocale } from '@/composables/useLocale';

const { LL } = useLocale();

interface Props {
  streamerModeEnabled: boolean;
  coinWinRateColor?: string;
}

withDefaults(defineProps<Props>(), {
  coinWinRateColor: 'info',
});

const expandedPanel = ref<string | undefined>('popup');

// OBS設定
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

<style scoped>
:deep(.v-expansion-panel) {
  margin-bottom: 8px;
  border-radius: 12px !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(128, 128, 128, 0.2);
}
</style>
