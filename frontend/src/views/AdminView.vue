<template>
  <div class="admin-view">
    <h1>管理者画面</h1>

    <div class="tabs">
      <button class="tab-button active">ユーザー管理</button>
      <button class="tab-button">統計</button>
      <button class="tab-button">メンテナンス</button>
    </div>

    <div class="tab-content">
      <UserManagementSection />
    </div>
  </div>
</template>

<script setup lang="ts">
import UserManagementSection from '../components/admin/UserManagementSection.vue';
</script>

<style scoped>
.admin-view {
  padding: 1rem;
}

.tabs {
  margin-bottom: 1rem;
}

.tab-button {
  padding: 0.5rem 1rem;
  border: 1px solid #ccc;
  background-color: #f0f0f0;
  cursor: pointer;
}

.tab-button.active {
  background-color: #fff;
  border-bottom: 1px solid #fff;
}

.tab-content {
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
}
</style>