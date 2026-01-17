import { ref, onUnmounted } from 'vue'

/**
 * キャンセル可能なリクエストを管理するcomposable
 * 
 * AbortControllerを使用して、連続したAPI リクエストを適切にキャンセルします。
 * 同じキーで新しいリクエストが発生した場合、前のリクエストは自動的にキャンセルされます。
 * これにより、フィルタの連続変更時などに古いリクエストが完了するのを待つ必要がなくなります。
 * 
 * @example
 * ```typescript
 * const { createRequest } = useCancellableRequest()
 * 
 * async function fetchData() {
 *   const { signal } = createRequest('statistics')
 *   try {
 *     const response = await api.get('/statistics', { signal })
 *     // ...
 *   } catch (error) {
 *     if (axios.isCancel(error)) {
 *       // リクエストがキャンセルされた（無視）
 *       return
 *     }
 *     // その他のエラー処理
 *   }
 * }
 * ```
 */
export function useCancellableRequest() {
  // キーごとにAbortControllerを管理するMap
  const controllers = ref<Map<string, AbortController>>(new Map())

  /**
   * キャンセル可能なリクエストを作成
   * 
   * 同じキーで既存のリクエストがある場合は自動的にキャンセルされます。
   * 
   * @param key - リクエストを識別するユニークなキー（例: 'statistics', 'duels'）
   * @returns AbortSignalとabort関数を含むオブジェクト
   */
  const createRequest = (key: string) => {
    // 既存のリクエストをキャンセル
    const existingController = controllers.value.get(key)
    if (existingController) {
      existingController.abort()
    }

    // 新しいAbortControllerを作成
    const controller = new AbortController()
    controllers.value.set(key, controller)

    return {
      signal: controller.signal,
      abort: () => controller.abort(),
    }
  }

  /**
   * 特定のキーのリクエストをキャンセル
   * 
   * @param key - キャンセルするリクエストのキー
   */
  const cancelRequest = (key: string) => {
    const controller = controllers.value.get(key)
    if (controller) {
      controller.abort()
      controllers.value.delete(key)
    }
  }

  /**
   * すべてのリクエストをキャンセル
   */
  const cancelAllRequests = () => {
    controllers.value.forEach((controller) => controller.abort())
    controllers.value.clear()
  }

  // コンポーネントがアンマウントされたら全てのリクエストをキャンセル
  onUnmounted(() => {
    cancelAllRequests()
  })

  return {
    createRequest,
    cancelRequest,
    cancelAllRequests,
  }
}
