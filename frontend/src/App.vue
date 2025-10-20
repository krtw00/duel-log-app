<template>
  <v-app :theme="themeStore.themeName">
    <router-view />

    <!-- グローバル通知システム -->
    <toast-notification />

    <!-- グローバルローディングオーバーレイ -->
    <loading-overlay />
  </v-app>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import ToastNotification from './components/common/ToastNotification.vue';
import LoadingOverlay from './components/common/LoadingOverlay.vue';
import { useThemeStore } from './stores/theme';

const themeStore = useThemeStore();

// アプリ起動時にテーマを読み込む
onMounted(() => {
  themeStore.loadTheme();
});
</script>

<style lang="scss">
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  overflow-x: hidden;
}

// Vuetifyのテーマ背景色を確実に適用
.v-application {
  background: rgb(var(--v-theme-background)) !important;
}

.v-main {
  background: rgb(var(--v-theme-background)) !important;
}
</style>
