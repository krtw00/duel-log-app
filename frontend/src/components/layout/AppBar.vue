<template>
  <v-app-bar elevation="0" class="app-bar">
    <div class="app-bar-glow"></div>

    <v-app-bar-title class="ml-4">
      <span class="text-primary font-weight-black">DUEL</span>
      <span class="text-secondary font-weight-black">LOG</span>
    </v-app-bar-title>

    <v-spacer />

    <template v-for="item in navItems" :key="item.view">
      <v-btn
        v-if="currentView !== item.view"
        :prepend-icon="item.icon"
        variant="text"
        @click="router.push(item.path)"
      >
        {{ item.name }}
      </v-btn>
    </template>

    <v-chip
      v-if="authStore.user"
      class="mr-4"
      prepend-icon="mdi-account-circle"
      color="primary"
      variant="tonal"
    >
      {{ authStore.user.username }}
    </v-chip>

    <v-btn
      icon="mdi-logout"
      @click="authStore.logout"
      variant="text"
    />
  </v-app-bar>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

defineProps<{
  currentView: 'dashboard' | 'decks' | 'statistics'
}>()

const router = useRouter()
const authStore = useAuthStore()

const navItems = [
  { name: 'ダッシュボード', path: '/', view: 'dashboard', icon: 'mdi-view-dashboard' },
  { name: 'デッキ管理', path: '/decks', view: 'decks', icon: 'mdi-cards' },
  { name: '統計', path: '/statistics', view: 'statistics', icon: 'mdi-chart-bar' }
]
</script>

<style scoped lang="scss">
.app-bar {
  background: rgba(18, 22, 46, 0.95) !important;
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 217, 255, 0.1);
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
  0% { opacity: 0.5; }
  50% { opacity: 1; }
  100% { opacity: 0.5; }
}
</style>
