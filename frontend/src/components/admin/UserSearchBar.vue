<template>
  <div class="search-bar">
    <input
      type="text"
      :value="modelValue"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      placeholder="ユーザー名またはメールで検索"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string;
}>();
defineEmits(['update:modelValue']);
</script>

<style scoped>
.search-bar input {
  padding: 0.5rem;
  width: 250px;
}
</style>
