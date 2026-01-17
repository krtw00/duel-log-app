import { ref, onUnmounted } from 'vue';
import { createLogger } from '@/utils/logger';

const logger = createLogger('SmartPolling');

export interface UseSmartPollingOptions {
  /** 実行する非同期関数 */
  fn: () => Promise<void>;
  /** 通常のポーリング間隔（ミリ秒） */
  interval: number;
  /** エラー時の最大バックオフ時間（ミリ秒、デフォルト: 60000） */
  maxBackoff?: number;
  /** ページが非表示の時にポーリングを停止するか（デフォルト: true） */
  pauseOnHidden?: boolean;
}

export interface UseSmartPollingReturn {
  /** ポーリングを開始 */
  start: () => void;
  /** ポーリングを停止 */
  stop: () => void;
  /** 現在ポーリング中かどうか */
  isPolling: Readonly<ReturnType<typeof ref<boolean>>>;
}

/**
 * スマートポーリング composable
 *
 * 特徴:
 * - setTimeout再スケジュール方式でポーリング
 * - document.visibilityStateを監視して非表示時は停止
 * - エラー時はエクスポネンシャルバックオフ（最大60秒）
 * - 正常時は元の間隔に戻る
 *
 * @example
 * const { start, stop, isPolling } = useSmartPolling({
 *   fn: async () => { await fetchData() },
 *   interval: 5000,
 *   maxBackoff: 60000,
 *   pauseOnHidden: true
 * })
 *
 * onMounted(() => {
 *   start()
 * })
 */
export function useSmartPolling(options: UseSmartPollingOptions): UseSmartPollingReturn {
  const { fn, interval, maxBackoff = 60000, pauseOnHidden = true } = options;

  const isPolling = ref(false);
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let currentInterval = interval;
  let errorCount = 0;
  let isPageVisible = true;

  /**
   * 次回のポーリングをスケジュール
   */
  const scheduleNext = () => {
    if (!isPolling.value) return;

    // 非表示時かつpauseOnHiddenが有効な場合はスキップ
    if (!isPageVisible && pauseOnHidden) {
      logger.debug('Page is hidden, skipping poll');
      timeoutId = setTimeout(scheduleNext, 1000); // 1秒後に再チェック
      return;
    }

    timeoutId = setTimeout(async () => {
      try {
        await fn();

        // 成功時はエラーカウントをリセットし、元の間隔に戻す
        errorCount = 0;
        currentInterval = interval;
        logger.debug(`Poll successful, next poll in ${currentInterval}ms`);
      } catch (error) {
        // エラー時はバックオフを適用
        errorCount++;
        const backoffMultiplier = Math.pow(2, errorCount - 1);
        currentInterval = Math.min(interval * backoffMultiplier, maxBackoff);
        logger.warn(
          `Poll failed (attempt ${errorCount}), next poll in ${currentInterval}ms`,
          error,
        );
      }

      scheduleNext();
    }, currentInterval);
  };

  /**
   * ページの可視性が変更された時のハンドラ
   */
  const handleVisibilityChange = () => {
    isPageVisible = document.visibilityState === 'visible';
    logger.debug(`Page visibility changed: ${document.visibilityState}`);

    if (isPageVisible && isPolling.value && pauseOnHidden) {
      // ページが表示されたら即座にポーリング実行
      logger.debug('Page became visible, executing poll immediately');
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      // 即座にポーリングを実行
      (async () => {
        try {
          await fn();
          errorCount = 0;
          currentInterval = interval;
          logger.debug(`Poll successful, next poll in ${currentInterval}ms`);
        } catch (error) {
          errorCount++;
          currentInterval = Math.min(interval * Math.pow(2, errorCount - 1), maxBackoff);
          logger.warn(
            `Poll failed (attempt ${errorCount}), next poll in ${currentInterval}ms`,
            error,
          );
        }
        scheduleNext();
      })();
    }
  };

  /**
   * ポーリングを開始
   */
  const start = () => {
    if (isPolling.value) {
      logger.debug('Polling already started');
      return;
    }

    logger.info(
      `Starting smart polling (interval: ${interval}ms, maxBackoff: ${maxBackoff}ms, pauseOnHidden: ${pauseOnHidden})`,
    );
    isPolling.value = true;
    errorCount = 0;
    currentInterval = interval;

    // 可視性監視を設定
    if (pauseOnHidden) {
      isPageVisible = document.visibilityState === 'visible';
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    // 即座に最初のポーリングを実行
    (async () => {
      try {
        await fn();
        logger.debug(`Initial poll successful, next poll in ${currentInterval}ms`);
      } catch (error) {
        // エラー時はバックオフを適用
        errorCount++;
        currentInterval = Math.min(interval * Math.pow(2, errorCount - 1), maxBackoff);
        logger.warn(`Initial poll failed, next poll in ${currentInterval}ms`, error);
      }
      scheduleNext();
    })();
  };

  /**
   * ポーリングを停止
   */
  const stop = () => {
    if (!isPolling.value) {
      logger.debug('Polling already stopped');
      return;
    }

    logger.info('Stopping smart polling');
    isPolling.value = false;

    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    // 可視性監視を解除
    if (pauseOnHidden) {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    }

    errorCount = 0;
    currentInterval = interval;
  };

  // コンポーネントがアンマウントされたら自動的に停止
  // （テスト環境など、Vueコンテキスト外で使う場合に対応）
  try {
    onUnmounted(() => {
      stop();
    });
  } catch {
    // Vueコンテキスト外で使われている場合は何もしない
  }

  return {
    start,
    stop,
    isPolling,
  };
}
