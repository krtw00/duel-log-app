<template>
  <app-layout current-view="admin" main-class="admin-main">
    <v-container fluid class="pa-6">
      <v-card class="admin-card mb-4">
        <v-card-title class="d-flex align-center pa-6">
          <v-icon class="mr-3" color="primary" size="large">mdi-shield-crown</v-icon>
          <span class="text-h4">管理者画面</span>
        </v-card-title>
      </v-card>

      <v-tabs v-model="currentTab" bg-color="transparent" color="primary" class="mb-4">
        <v-tab value="users">
          <v-icon start>mdi-account-multiple</v-icon>
          ユーザー管理
        </v-tab>
        <v-tab value="statistics" disabled>
          <v-icon start>mdi-chart-box</v-icon>
          統計
        </v-tab>
        <v-tab value="maintenance">
          <v-icon start>mdi-tools</v-icon>
          メンテナンス
        </v-tab>
      </v-tabs>

      <v-window v-model="currentTab">
        <v-window-item value="users">
          <user-management-section />
        </v-window-item>

        <v-window-item value="statistics">
          <v-card class="pa-6">
            <v-card-text class="text-center">
              <v-icon size="64" color="grey">mdi-chart-box</v-icon>
              <p class="text-h6 mt-4">統計機能は近日公開予定です</p>
            </v-card-text>
          </v-card>
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
import MaintenanceSection from '@/components/admin/MaintenanceSection.vue';

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
