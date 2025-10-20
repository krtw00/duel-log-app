<template>
  <v-app-bar elevation="0" class="app-bar">
    <div class="app-bar-glow"></div>

    <v-app-bar-nav-icon class="hidden-md-and-up" @click="$emit('toggle-drawer')" />

    <v-app-bar-title class="ml-4 ml-sm-4 ml-xs-2">
      <span class="text-primary font-weight-black app-title">DUEL</span>
      <span class="text-secondary font-weight-black app-title">LOG</span>
    </v-app-bar-title>

    <v-spacer />

    <!-- テーマ切り替えボタン -->
    <v-btn
      :icon="themeStore.isDark ? 'mdi-weather-sunny' : 'mdi-weather-night'"
      variant="text"
      @click="themeStore.toggleTheme"
      class="mr-2"
    />

    <template v-for="item in navItems" :key="item.view">
      <v-btn
        v-if="currentView !== item.view"
        :prepend-icon="item.icon"
        variant="text"
        class="hidden-sm-and-down"
        @click="router.push(item.path)"
      >
        {{ item.name }}
      </v-btn>
    </template>

    <v-menu v-if="authStore.user" location="bottom">
      <template #activator="{ props }">
        <v-chip
          v-bind="props"
          class="mr-2 mr-sm-4"
          prepend-icon="mdi-account-circle"
          :color="authStore.isStreamerModeEnabled ? 'purple' : 'primary'"
          variant="tonal"
          size="small"
        >
          <v-icon v-if="authStore.isStreamerModeEnabled" size="small" class="mr-1"
            >mdi-video</v-icon
          >
          <span class="d-none d-sm-inline">{{ authStore.user.username }}</span>
        </v-chip>
      </template>

      <v-list density="compact">
        <v-list-item>
          <v-list-item-title class="text-caption text-grey">
            {{ displayEmail }}
          </v-list-item-title>
        </v-list-item>
        <v-divider />
        <v-list-item to="/profile">
          <template #prepend>
            <v-icon>mdi-account-edit</v-icon>
          </template>
          <v-list-item-title>プロフィール</v-list-item-title>
        </v-list-item>
        <v-list-item @click="authStore.logout">
          <template #prepend>
            <v-icon>mdi-logout</v-icon>
          </template>
          <v-list-item-title>ログアウト</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </v-app-bar>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import { useThemeStore } from '../../stores/theme.ts';
import { maskEmail } from '../../utils/maskEmail';

defineProps<{
  currentView: 'dashboard' | 'decks' | 'statistics' | 'profile';
}>();

defineEmits(['toggle-drawer']);

const router = useRouter();
const authStore = useAuthStore();
const themeStore = useThemeStore();

const navItems = [
  { name: 'ダッシュボード', path: '/', view: 'dashboard', icon: 'mdi-view-dashboard' },
  { name: 'デッキ管理', path: '/decks', view: 'decks', icon: 'mdi-cards' },
  { name: '統計', path: '/statistics', view: 'statistics', icon: 'mdi-chart-bar' },
];

const displayEmail = computed(() => {
  if (!authStore.user) return '';
  return authStore.isStreamerModeEnabled ? maskEmail(authStore.user.email) : authStore.user.email;
});
</script>

<style scoped lang="scss">
.app-bar {
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(128, 128, 128, 0.2);
  position: relative;
  overflow: hidden;

  .v-btn,
  .v-chip {
    font-size: 20px;
  }
}

.app-bar-glow {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #00d9ff, #b536ff, #ff2d95);
  animation: shimmer 3s linear infinite;
}

@keyframes shimmer {
  0% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.5;
  }
}

// スマホ対応
@media (max-width: 599px) {
  .app-bar {
    .app-title {
      font-size: 1.25rem !important;
    }

    .v-btn {
      font-size: 14px !important;
    }
  }
}
</style>
