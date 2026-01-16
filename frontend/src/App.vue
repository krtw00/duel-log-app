<template>
  <v-app :theme="themeStore.themeName">
    <!-- 初期化中のローディング表示 -->
    <template v-if="!authStore.isInitialized && showInitialLoader">
      <v-main>
        <v-container class="fill-height" fluid>
          <v-row align="center" justify="center">
            <v-col cols="12" class="text-center">
              <v-progress-circular indeterminate size="64" color="primary" />
              <p class="mt-4 text-grey">{{ LL?.auth.checkingStatus() }}</p>
            </v-col>
          </v-row>
        </v-container>
      </v-main>
    </template>

    <!-- 初期化完了後のメインコンテンツ -->
    <template v-else>
      <router-view />
    </template>

    <!-- グローバル通知システム -->
    <toast-notification />

    <!-- グローバルローディングオーバーレイ -->
    <loading-overlay />
  </v-app>
</template>

<script setup lang="ts">
import { onMounted, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import ToastNotification from '@/components/common/ToastNotification.vue';
import LoadingOverlay from '@/components/common/LoadingOverlay.vue';
import { useThemeStore } from '@/stores/theme';
import { useAuthStore } from '@/stores/auth';
import { useLocale } from '@/composables/useLocale';

const themeStore = useThemeStore();
const authStore = useAuthStore();
const route = useRoute();
const { LL } = useLocale();

// 特定のルートでは初期ローダーを表示しない（AuthCallbackなど）
const showInitialLoader = computed(() => {
  const skipLoaderRoutes = ['/auth/callback', '/obs-overlay'];
  return !skipLoaderRoutes.includes(route?.path ?? '');
});

// クロマキー背景のCSSクラスを計算
const chromaKeyClass = computed(() => {
  if (!authStore.isStreamerModeEnabled) return '';
  switch (authStore.chromaKeyBackground) {
    case 'green':
      return 'chroma-key-green';
    case 'blue':
      return 'chroma-key-blue';
    default:
      return '';
  }
});

// クロマキー背景のCSSクラスをbodyに適用
watch(
  chromaKeyClass,
  (newClass, oldClass) => {
    if (oldClass) {
      document.body.classList.remove(oldClass);
    }
    if (newClass) {
      document.body.classList.add(newClass);
    }
  },
  { immediate: true }
);

// アプリ起動時にテーマを読み込む
onMounted(() => {
  themeStore.loadTheme();
});

// ユーザー情報が変更されたらテーマを再読み込み
watch(
  () => authStore.user,
  () => {
    themeStore.loadTheme();
  },
);
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

// OBSオーバーレイページのみ背景を透明にする
body.obs-overlay-page {
  .v-application,
  .v-main {
    background: transparent !important;
  }
}

// クロマキー背景（配信者モード用）
body.chroma-key-green {
  .v-application,
  .v-main {
    background: #00FF00 !important;
  }
}

body.chroma-key-blue {
  .v-application,
  .v-main {
    background: #0000FF !important;
  }
}
</style>
