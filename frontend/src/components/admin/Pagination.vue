<template>
  <div class="pagination" v-if="total > 0">
    <button @click="changePage(currentPage - 1)" :disabled="currentPage === 1">
      &lt;
    </button>
    <span> ページ {{ currentPage }} / {{ totalPages }} </span>
    <button @click="changePage(currentPage + 1)" :disabled="currentPage === totalPages">
      &gt;
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  currentPage: number;
  perPage: number;
  total: number;
}>();

const emit = defineEmits(['page-changed']);

const totalPages = computed(() => {
  if (props.total === 0) return 1;
  return Math.ceil(props.total / props.perPage);
});

function changePage(page: number) {
  if (page > 0 && page <= totalPages.value) {
    emit('page-changed', page);
  }
}
</script>

<style scoped>
.pagination {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
}
</style>
