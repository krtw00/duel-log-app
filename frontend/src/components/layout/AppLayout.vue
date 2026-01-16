<template>
  <div class="app-layout">
    <app-bar :current-view="currentView" @toggle-drawer="drawer = !drawer" />

    <!-- デスクトップ用ドロワー -->
    <v-navigation-drawer v-model="drawer" temporary>
      <v-list nav dense>
        <v-list-item
          v-for="item in resolvedNavItems"
          :key="item.view"
          :prepend-icon="item.icon"
          :to="item.path"
          :title="item.name"
        />
      </v-list>
    </v-navigation-drawer>

    <v-main :class="mainClass">
      <slot />
    </v-main>

    <slot name="overlay" />

    <!-- モバイル用ボトムナビゲーション -->
    <v-bottom-navigation
      v-if="isMobile"
      v-model="activeRoute"
      grow
      class="bottom-nav"
    >
      <v-btn value="/" :to="{ path: '/' }" :class="{ 'nav-active': currentView === 'dashboard' }">
        <v-icon>mdi-home</v-icon>
        <span>{{ LL?.nav.dashboard() }}</span>
      </v-btn>

      <v-btn value="/statistics" :to="{ path: '/statistics' }" :class="{ 'nav-active': currentView === 'statistics' }">
        <v-icon>mdi-chart-line</v-icon>
        <span>{{ LL?.nav.statistics() }}</span>
      </v-btn>

      <!-- 中央FAB（新規追加） -->
      <v-btn value="add" class="fab-center" @click="openDuelForm">
        <v-icon size="28">mdi-plus</v-icon>
      </v-btn>

      <v-btn value="/decks" :to="{ path: '/decks' }" :class="{ 'nav-active': currentView === 'decks' }">
        <v-icon>mdi-cards</v-icon>
        <span>{{ LL?.nav.decks() }}</span>
      </v-btn>

      <v-btn value="/profile" :to="{ path: '/profile' }" :class="{ 'nav-active': currentView === 'profile' }">
        <v-icon>mdi-account</v-icon>
        <span>{{ LL?.nav.profile() }}</span>
      </v-btn>
    </v-bottom-navigation>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';
import AppBar from '@/components/layout/AppBar.vue';
import { useLocale } from '@/composables/useLocale';

type CurrentView = 'dashboard' | 'decks' | 'statistics' | 'profile' | 'admin' | 'feedback';

interface NavItem {
  name: string;
  path: string;
  view: CurrentView;
  icon: string;
}

interface Props {
  currentView: CurrentView;
  navItems?: NavItem[];
  mainClass?: string | string[];
}

const props = defineProps<Props>();

const { LL } = useLocale();
const route = useRoute();
const router = useRouter();
const { smAndDown } = useDisplay();

const openDuelForm = () => {
  // ダッシュボードに遷移し、クエリパラメータで対戦入力ダイアログを開く
  router.push({ path: '/', query: { action: 'new-duel' } });
};

const drawer = ref(false);
const isMobile = computed(() => smAndDown.value);
const activeRoute = computed(() => route.path);

const defaultNavItems: NavItem[] = [
  { name: 'ダッシュボード', path: '/', view: 'dashboard', icon: 'mdi-view-dashboard' },
  { name: 'デッキ管理', path: '/decks', view: 'decks', icon: 'mdi-cards' },
  { name: '統計', path: '/statistics', view: 'statistics', icon: 'mdi-chart-bar' },
];

const resolvedNavItems = computed(() => props.navItems ?? defaultNavItems);
const mainClass = computed(() => {
  const classes = ['main-content', props.mainClass].filter(Boolean);
  // モバイル時はボトムナビ分のパディングを追加
  if (isMobile.value) {
    classes.push('has-bottom-nav');
  }
  return classes;
});
</script>

<style scoped lang="scss">
.app-layout {
  min-height: 100vh;
}

.main-content {
  min-height: 100vh;
}

.has-bottom-nav {
  padding-bottom: 88px; // ボトムナビの高さ + 余白
}

// ボトムナビゲーション
.bottom-nav {
  position: fixed !important;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  height: 72px !important;
  border-top: 1px solid rgba(128, 128, 128, 0.2);
  backdrop-filter: blur(10px);
  overflow: visible !important;

  :deep(.v-bottom-navigation__content) {
    overflow: visible !important;
  }

  :deep(.v-btn:not(.fab-center)) {
    min-width: 0 !important;
    height: 72px !important;

    span {
      font-size: 10px;
      margin-top: 2px;
    }
  }

  .nav-active {
    :deep(.v-icon) {
      color: rgb(var(--v-theme-primary));
      transform: scale(1.1);
    }

    span {
      color: rgb(var(--v-theme-primary));
      font-weight: 600;
    }

    // アクティブインジケーター
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 24px;
      height: 3px;
      background: rgb(var(--v-theme-primary));
      border-radius: 0 0 4px 4px;
    }
  }
}

// 中央FABボタン
.fab-center {
  background: rgb(var(--v-theme-primary)) !important;
  border-radius: 50% !important;
  min-width: 52px !important;
  max-width: 52px !important;
  width: 52px !important;
  min-height: 52px !important;
  height: 52px !important;
  flex: 0 0 52px !important;
  align-self: center !important;
  margin-top: auto !important;
  margin-bottom: auto !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);

  :deep(.v-icon) {
    color: white !important;
    font-size: 28px !important;
  }

  &:hover {
    transform: scale(1.05);
  }
}
</style>
