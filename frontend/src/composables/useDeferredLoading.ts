/**
 * useDeferredLoading Composable
 *
 * 短時間で完了するリクエストではローディング表示を抑制し、
 * UXを向上させるためのcomposable
 *
 * @example
 * ```ts
 * const { isLoading, startLoading, stopLoading } = useDeferredLoading(300)
 *
 * async function fetchData() {
 *   startLoading()
 *   try {
 *     await api.get('/data')
 *   } finally {
 *     stopLoading()
 *   }
 * }
 * ```
 */

import { ref, onUnmounted } from 'vue'

export interface UseDeferredLoadingOptions {
  /**
   * ローディング表示までの遅延時間（ミリ秒）
   * @default 300
   */
  delay?: number
}

export function useDeferredLoading(options: UseDeferredLoadingOptions = {}) {
  const { delay = 300 } = options

  const isLoading = ref(false)
  const isPending = ref(false)
  let delayTimer: ReturnType<typeof setTimeout> | null = null

  /**
   * ローディング開始
   * 指定された遅延時間後にローディング表示を開始
   */
  const startLoading = () => {
    isPending.value = true

    // 既存のタイマーをクリア
    if (delayTimer) {
      clearTimeout(delayTimer)
    }

    // 遅延後にローディング表示
    delayTimer = setTimeout(() => {
      if (isPending.value) {
        isLoading.value = true
      }
    }, delay)
  }

  /**
   * ローディング終了
   * ローディング表示とペンディング状態をクリア
   */
  const stopLoading = () => {
    isPending.value = false
    isLoading.value = false

    // タイマーをクリア
    if (delayTimer) {
      clearTimeout(delayTimer)
      delayTimer = null
    }
  }

  /**
   * リセット（強制的にローディング状態をクリア）
   */
  const reset = () => {
    stopLoading()
  }

  // コンポーネントがアンマウントされたらタイマーをクリア
  onUnmounted(() => {
    if (delayTimer) {
      clearTimeout(delayTimer)
    }
  })

  return {
    isLoading,
    isPending,
    startLoading,
    stopLoading,
    reset,
  }
}
