<template>
  <div v-if="visible" :class="['inline-loader', sizeClass]">
    <v-progress-circular
      :size="circularSize"
      :width="circularWidth"
      :color="color"
      indeterminate
    />
    <span v-if="text" class="inline-loader__text">{{ text }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface InlineLoaderProps {
  /**
   * ローディング表示の可視性
   */
  visible?: boolean

  /**
   * ローダーのサイズ
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large'

  /**
   * ローダーの色
   * @default 'primary'
   */
  color?: string

  /**
   * ローダーの横に表示するテキスト
   */
  text?: string
}

const props = withDefaults(defineProps<InlineLoaderProps>(), {
  visible: true,
  size: 'medium',
  color: 'primary',
  text: undefined,
})

const sizeClass = computed(() => `inline-loader--${props.size}`)

const circularSize = computed(() => {
  switch (props.size) {
    case 'small':
      return 16
    case 'large':
      return 32
    case 'medium':
    default:
      return 24
  }
})

const circularWidth = computed(() => {
  switch (props.size) {
    case 'small':
      return 2
    case 'large':
      return 4
    case 'medium':
    default:
      return 3
  }
})
</script>

<style scoped lang="scss">
.inline-loader {
  display: inline-flex;
  align-items: center;
  gap: 8px;

  &__text {
    color: rgba(var(--v-theme-on-surface), 0.7);
    font-size: 0.875rem;
  }

  &--small {
    gap: 4px;

    .inline-loader__text {
      font-size: 0.75rem;
    }
  }

  &--large {
    gap: 12px;

    .inline-loader__text {
      font-size: 1rem;
    }
  }
}
</style>
