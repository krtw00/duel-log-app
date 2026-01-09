<template>
  <div>
    <app-bar :current-view="currentView" @toggle-drawer="drawer = !drawer" />

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
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import AppBar from '@/components/layout/AppBar.vue';

type CurrentView = 'dashboard' | 'decks' | 'statistics' | 'profile' | 'admin';

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
const drawer = ref(false);

const defaultNavItems: NavItem[] = [
  { name: 'ダッシュボード', path: '/', view: 'dashboard', icon: 'mdi-view-dashboard' },
  { name: 'デッキ管理', path: '/decks', view: 'decks', icon: 'mdi-cards' },
  { name: '統計', path: '/statistics', view: 'statistics', icon: 'mdi-chart-bar' },
];

const resolvedNavItems = computed(() => props.navItems ?? defaultNavItems);
const mainClass = computed(() => ['main-content', props.mainClass].filter(Boolean));
</script>

<style scoped>
.main-content {
  min-height: 100vh;
}
</style>
