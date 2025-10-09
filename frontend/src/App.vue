<template>
  <router-view />

  <!-- グローバル通知システム -->
  <toast-notification />

  <!-- グローバルローディングオーバーレイ -->
  <loading-overlay />
</template>

<script setup lang="ts">
import ToastNotification from './components/common/ToastNotification.vue';
import LoadingOverlay from './components/common/LoadingOverlay.vue';
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
</style>
