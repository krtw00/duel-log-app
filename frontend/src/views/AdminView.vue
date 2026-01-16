<template>
  <app-layout current-view="admin" main-class="admin-main">
    <v-container fluid class="pa-6">
      <v-card class="admin-card mb-4">
        <v-card-title class="d-flex align-center pa-6">
          <v-icon class="mr-3" color="primary" size="large">mdi-shield-crown</v-icon>
          <span class="text-h4">{{ LL?.admin.title() }}</span>
        </v-card-title>
      </v-card>

      <v-tabs v-model="currentTab" bg-color="transparent" color="primary" class="mb-4">
        <v-tab value="users">
          <v-icon start>mdi-account-multiple</v-icon>
          {{ LL?.admin.users.title() }}
        </v-tab>
        <v-tab value="statistics">
          <v-icon start>mdi-chart-box</v-icon>
          {{ LL?.admin.statistics.title() }}
        </v-tab>
        <v-tab value="meta">
          <v-icon start>mdi-chart-timeline-variant</v-icon>
          {{ LL?.admin.meta?.title() || 'メタ分析' }}
        </v-tab>
        <v-tab value="maintenance">
          <v-icon start>mdi-tools</v-icon>
          {{ LL?.admin.maintenance.title() }}
        </v-tab>
      </v-tabs>

      <v-window v-model="currentTab">
        <v-window-item value="users">
          <user-management-section />
        </v-window-item>

        <v-window-item value="statistics">
          <statistics-section />
        </v-window-item>

        <v-window-item value="meta">
          <meta-analysis-section />
        </v-window-item>

        <v-window-item value="maintenance">
          <maintenance-section />
        </v-window-item>
      </v-window>
    </v-container>
  </app-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import AppLayout from '@/components/layout/AppLayout.vue';
import UserManagementSection from '@/components/admin/UserManagementSection.vue';
import StatisticsSection from '@/components/admin/StatisticsSection.vue';
import MetaAnalysisSection from '@/components/admin/MetaAnalysisSection.vue';
import MaintenanceSection from '@/components/admin/MaintenanceSection.vue';
import { useLocale } from '@/composables/useLocale';

const { LL } = useLocale();
const currentTab = ref('users');
</script>

<style scoped>
:deep(.admin-main) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.admin-card {
  backdrop-filter: blur(20px);
  border: 1px solid rgba(128, 128, 128, 0.2);
  border-radius: 12px !important;
}
</style>
