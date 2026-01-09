<template>
  <div class="filters">
    <label>
      <input
        type="checkbox"
        :checked="modelValue"
        @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
      />
      管理者のみ表示
    </label>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean;
}>();
defineEmits(['update:modelValue']);
</script>

<style scoped>
.filters label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
