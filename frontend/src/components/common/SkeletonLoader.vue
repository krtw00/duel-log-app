<template>
  <v-skeleton-loader
    v-if="visible"
    :type="skeletonType"
    :height="height"
    :width="width"
    :class="loaderClass"
  />
  <slot v-else />
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface SkeletonLoaderProps {
  /**
   * ローディング表示の可視性
   */
  visible?: boolean

  /**
   * スケルトンのタイプ
   * @default 'card'
   */
  type?: 'card' | 'table' | 'chart' | 'list-item' | 'text' | 'avatar' | 'custom'

  /**
   * カスタムタイプ（Vuetifyのv-skeleton-loaderのtype属性）
   */
  customType?: string

  /**
   * 高さ
   */
  height?: string | number

  /**
   * 幅
   */
  width?: string | number

  /**
   * 追加のCSSクラス
   */
  class?: string
}

const props = withDefaults(defineProps<SkeletonLoaderProps>(), {
  visible: true,
  type: 'card',
  customType: undefined,
  height: undefined,
  width: undefined,
  class: undefined,
})

const skeletonType = computed(() => {
  if (props.customType) {
    return props.customType
  }

  switch (props.type) {
    case 'card':
      return 'card'
    case 'table':
      return 'table'
    case 'chart':
      return 'image'
    case 'list-item':
      return 'list-item-avatar'
    case 'text':
      return 'text'
    case 'avatar':
      return 'avatar'
    case 'custom':
      return props.customType || 'card'
    default:
      return 'card'
  }
})

const loaderClass = computed(() => {
  const classes = ['skeleton-loader']
  if (props.class) {
    classes.push(props.class)
  }
  return classes.join(' ')
})
</script>

<style scoped lang="scss">
.skeleton-loader {
  // スケルトンローダーのカスタムスタイルが必要な場合はここに追加
}
</style>
