<template>
  <div v-if="modelValue" class="dialog-overlay">
    <div class="dialog">
      <h3>{{ title }}</h3>
      <p>{{ message }}</p>
      <div class="actions">
        <button @click="$emit('cancel')">キャンセル</button>
        <button @click="$emit('confirm')" class="confirm-button">確認</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean;
  title: string;
  message: string;
}>();
defineEmits(['cancel', 'confirm']);
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}
.dialog {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}
.actions {
  margin-top: 1rem;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}
.confirm-button {
  background-color: #dc3545;
  color: white;
}
</style>
