<template>
  <v-app-bar elevation="0" class="app-bar">
    <div class="app-bar-glow"></div>

    <v-app-bar-title class="ml-4">
      <span class="text-primary font-weight-black">DUEL</span>
      <span class="text-secondary font-weight-black">LOG</span>
    </v-app-bar-title>

    <v-spacer />

    <v-btn
      v-if="currentView === 'decks'"
      prepend-icon="mdi-view-dashboard"
      variant="text"
      @click="router.push('/')"
    >
      ダッシュボード
    </v-btn>
    <v-btn
      v-if="currentView === 'dashboard'"
      prepend-icon="mdi-cards"
      variant="text"
      @click="router.push('/decks')"
    >
      デッキ管理
    </v-btn>

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
  currentView: 'dashboard' | 'decks'
}>()

const router = useRouter()
const authStore = useAuthStore()
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
