/**
 * 画面解析Composable
 *
 * OCR（Tesseract.js）による画面解析を提供
 * VICTORY/LOSEやコイントス結果をテキスト認識で検出
 * FSMはメインスレッドで管理し、Vue DevToolsでデバッグ可能
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { createLogger } from '@/utils/logger';
import {
  createFSM,
  createCanvas,
  FSM_CONFIG,
  WORKER_CONFIG,
  ANALYSIS_CONFIG,
  type WorkerMessage,
  type WorkerResponse,
  type DetectionScores,
  type ModelStatus,
  type CoinResult,
  type MatchResult,
} from '@/utils/screenAnalysis/index';

const logger = createLogger('ScreenAnalysis');

export function useScreenAnalysis() {
  // FSM
  const fsm = createFSM(FSM_CONFIG);

  // 状態
  const isRunning = ref(false);
  const errorMessage = ref<string | null>(null);
  const lastResult = ref<MatchResult | null>(null);
  const lastCoinResult = ref<CoinResult | null>(null);

  // FSM状態から派生
  const turnChoiceAvailable = computed(() => {
    const now = Date.now();
    return fsm.isCoinActive(now) || fsm.state.phase === 'coinDetected';
  });
  const turnChoiceEventId = computed(() => fsm.state.coinEventId);
  const resultEventId = computed(() => fsm.state.resultEventId);
  const resultLockState = computed(() => (fsm.state.resultLocked ? 'locked' : 'unlocked'));
  const fsmPhase = computed(() => fsm.state.phase);

  // 分類スコア（デバッグ用）
  const lastScores = ref<DetectionScores>({
    coinWin: 0,
    coinLose: 0,
    resultWin: 0,
    resultLose: 0,
    coinLabel: 'none',
    resultLabel: 'none',
    timestamp: 0,
  });

  // モデル状態
  const modelStatus = ref<ModelStatus>({
    tfjsReady: false,
    coinModelLoaded: false,
    resultModelLoaded: false,
    usingFallback: true,
  });

  // Worker関連
  let worker: Worker | null = null;
  const currentFps = ref(ANALYSIS_CONFIG.scanFps);

  // ログ蓄積用（デバッグ用ダウンロード機能）
  interface LogEntry {
    timestamp: number;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
  }
  const logs = ref<LogEntry[]>([]);
  const maxLogEntries = 10000; // メモリ節約のため上限設定

  // キャプチャ関連
  let stream: MediaStream | null = null;
  let video: HTMLVideoElement | null = null;
  let canvas: HTMLCanvasElement | OffscreenCanvas | null = null;
  let ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null;
  let intervalId: number | null = null;
  let drawParams: { sx: number; sy: number; sWidth: number; sHeight: number } | null = null;

  // 互換性のための空のテンプレートステータス
  const templateStatus = ref({
    coinWin: false,
    coinLose: false,
    win: false,
    lose: false,
  });
  const missingTemplates = computed(() => {
    const missing: string[] = [];
    if (!modelStatus.value.coinModelLoaded && !modelStatus.value.usingFallback) {
      missing.push('coin-model');
    }
    if (!modelStatus.value.resultModelLoaded && !modelStatus.value.usingFallback) {
      missing.push('result-model');
    }
    return missing;
  });
  const templateErrors = ref({
    coinWin: '',
    coinLose: '',
    win: '',
    lose: '',
  });

  /**
   * 状態リセット（次の対戦用）
   */
  const resetState = () => {
    lastResult.value = null;
    lastCoinResult.value = null;
    lastScores.value = {
      coinWin: 0,
      coinLose: 0,
      resultWin: 0,
      resultLose: 0,
      coinLabel: 'none',
      resultLabel: 'none',
      timestamp: 0,
    };
    fsm.softReset();

    // Workerに通知
    if (worker) {
      const message: WorkerMessage = { type: 'reset' };
      worker.postMessage(message);
    }
  };

  /**
   * 完全リセット（キャプチャ停止時）
   */
  const resetStateComplete = () => {
    resetState();
    fsm.reset();
  };

  /**
   * Workerメッセージハンドラを設定
   */
  const setupWorkerMessageHandler = () => {
    if (!worker) return;

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const response = event.data;

      switch (response.type) {
        case 'init':
          // initWorkerで処理済みなのでここでは何もしない
          break;

        case 'scores': {
          // スコアを更新
          lastScores.value = { ...response.scores };

          // FSMでスコアを処理
          const fsmEvent = fsm.processScores(response.scores);

          // FSM状態をログに追加（検出時または10フレームごと）
          const hasDetection =
            response.scores.coinLabel !== 'none' || response.scores.resultLabel !== 'none';
          const frameNum = logs.value.length;
          if (hasDetection || frameNum % 10 === 0) {
            const fsmLog: LogEntry = {
              timestamp: response.scores.timestamp,
              level: 'debug',
              message:
                `[FSM] phase=${fsm.state.phase}, resultLocked=${fsm.state.resultLocked}, ` +
                `coinStreak=${fsm.state.coinStreak.toFixed(1)}, resultStreak=${fsm.state.resultStreak.toFixed(1)}`,
            };
            logs.value.push(fsmLog);
          }

          // 検出イベントを処理
          if (fsmEvent?.type === 'coinDetected') {
            lastCoinResult.value = fsmEvent.result;
            logger.info(`Coin detected: ${fsmEvent.result}`);
            // ログにも追加
            logs.value.push({
              timestamp: fsmEvent.timestamp,
              level: 'info',
              message: `[FSM] ★ Coin detected: ${fsmEvent.result} (eventId: ${fsmEvent.eventId})`,
            });
          }
          if (fsmEvent?.type === 'resultDetected') {
            lastResult.value = fsmEvent.result;
            logger.info(`Result detected: ${fsmEvent.result}`);
            // ログにも追加
            logs.value.push({
              timestamp: fsmEvent.timestamp,
              level: 'info',
              message: `[FSM] ★ Result detected: ${fsmEvent.result} (eventId: ${fsmEvent.eventId})`,
            });
          }
          break;
        }

        case 'error':
          logger.error('Worker error:', response.error);
          errorMessage.value = response.error;
          fsm.setError(response.error);
          break;

        case 'log': {
          // ログを蓄積
          const entry: LogEntry = {
            timestamp: response.timestamp,
            level: response.level,
            message: response.message,
          };
          logs.value.push(entry);
          // 上限を超えたら古いログを削除
          if (logs.value.length > maxLogEntries) {
            logs.value.splice(0, logs.value.length - maxLogEntries);
          }
          break;
        }

        case 'debugImage': {
          // デバッグ画像をサーバーに保存
          void saveDebugImage(
            response.imageType,
            response.dataUrl,
            response.frameCount,
            response.timestamp,
            response.metadata,
          );
          break;
        }

        default:
          logger.warn('Unknown worker response type:', response);
      }
    };

    worker.onerror = (error) => {
      logger.error('Worker error:', error);
      errorMessage.value = 'Worker execution error';
      fsm.setError('Worker execution error');
      stopCapture();
    };
  };

  /**
   * Workerを初期化
   */
  const initWorker = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        // Workerを作成（OCRベース）
        worker = new Worker(new URL('../workers/screenAnalysisOCR.worker.ts', import.meta.url), {
          type: 'module',
        });

        // 初期化完了を待つハンドラを設定
        const initHandler = (event: MessageEvent<WorkerResponse>) => {
          const response = event.data;
          if (response.type === 'init') {
            if (response.success) {
              logger.info('Worker initialized successfully');
              if (response.modelStatus) {
                modelStatus.value = { ...response.modelStatus };
                templateStatus.value = {
                  coinWin: true,
                  coinLose: true,
                  win: true,
                  lose: true,
                };
              }
              // 通常のメッセージハンドラに切り替え
              setupWorkerMessageHandler();
              resolve();
            } else {
              logger.error('Worker initialization failed:', response.error);
              errorMessage.value = response.error ?? 'Worker initialization failed';
              fsm.setError(response.error ?? 'Worker initialization failed');
              reject(new Error(response.error));
            }
          }
        };

        worker.onmessage = initHandler;

        worker.onerror = (error) => {
          logger.error('Worker error during init:', error);
          reject(error);
        };

        // Workerに初期化メッセージを送信
        const message: WorkerMessage = {
          type: 'init',
          config: WORKER_CONFIG,
        };

        worker.postMessage(message);

        logger.info('Worker initialization message sent, waiting for response...');
      } catch (error) {
        logger.error('Failed to initialize worker:', error);
        reject(error);
      }
    });
  };

  /**
   * FPSを設定
   */
  const setAnalysisFps = (fps: number) => {
    currentFps.value = fps;

    // インターバル再設定
    if (intervalId !== null && isRunning.value) {
      window.clearInterval(intervalId);
      intervalId = window.setInterval(() => void analyzeFrame(), 1000 / fps);
    }

    // Workerに通知
    if (worker) {
      const message: WorkerMessage = { type: 'setFps', fps };
      worker.postMessage(message);
    }

    logger.info(`Analysis FPS set to ${fps}`);
  };

  /**
   * フレーム解析
   */
  const analyzeFrame = async () => {
    if (!ctx || !canvas || !video || !worker) {
      return;
    }

    // ビデオフレームをCanvasに描画
    if (drawParams) {
      ctx.drawImage(
        video,
        drawParams.sx,
        drawParams.sy,
        drawParams.sWidth,
        drawParams.sHeight,
        0,
        0,
        canvas.width,
        canvas.height,
      );
    } else {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    // ImageDataを取得してWorkerに送信
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const message: WorkerMessage = {
      type: 'analyze',
      imageData,
      timestamp: Date.now(),
    };

    // Transferable Objectsを使用してゼロコピー転送
    worker.postMessage(message, [imageData.data.buffer]);
  };

  /**
   * キャプチャ開始
   */
  const startCapture = async () => {
    if (isRunning.value) return;
    errorMessage.value = null;
    resetStateComplete();

    try {
      // Workerを初期化
      await initWorker();

      // 画面共有を開始
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: currentFps.value,
        },
        audio: false,
      });

      // ビデオ要素を作成
      video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      await video.play();

      const videoWidth = video.videoWidth || ANALYSIS_CONFIG.normalizedWidth;
      const videoHeight = video.videoHeight || Math.round((videoWidth * 9) / 16);

      // 16:9にクロップ
      const targetAspect = 16 / 9;
      const videoAspect = videoWidth / videoHeight;
      let sx = 0;
      let sy = 0;
      let sWidth = videoWidth;
      let sHeight = videoHeight;

      if (Math.abs(videoAspect - targetAspect) > 0.01) {
        if (videoAspect > targetAspect) {
          sWidth = Math.round(videoHeight * targetAspect);
          sx = Math.round((videoWidth - sWidth) / 2);
        } else {
          sHeight = Math.round(videoWidth / targetAspect);
          sy = Math.round((videoHeight - sHeight) / 2);
        }
      }

      // Canvas作成（メモリ節約のため1280幅に縮小）
      const scale = ANALYSIS_CONFIG.normalizedWidth / sWidth;
      const canvasWidth = ANALYSIS_CONFIG.normalizedWidth;
      const canvasHeight = Math.round(sHeight * scale);

      drawParams = { sx, sy, sWidth, sHeight };
      canvas = createCanvas(canvasWidth, canvasHeight);
      ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        throw new Error('Failed to initialize canvas context');
      }

      logger.info(`Starting capture at resolution: ${canvasWidth}x${canvasHeight}`);

      // トラック終了時の処理
      const track = stream.getVideoTracks()[0];
      track.addEventListener('ended', () => {
        stopCapture();
      });

      isRunning.value = true;

      // 解析インターバル開始
      const intervalMs = 1000 / currentFps.value;
      logger.info(`Setting up analysis interval: ${intervalMs}ms (${currentFps.value} FPS)`);
      intervalId = window.setInterval(() => void analyzeFrame(), intervalMs);
    } catch (error) {
      logger.error('Failed to start capture:', error);
      errorMessage.value = '画面共有の開始に失敗しました';
      fsm.setError('Failed to start capture');
      stopCapture();
    }
  };

  /**
   * キャプチャ停止
   */
  const stopCapture = () => {
    if (intervalId !== null) {
      window.clearInterval(intervalId);
      intervalId = null;
    }

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
    }

    if (video) {
      video.srcObject = null;
      video = null;
    }

    if (worker) {
      worker.terminate();
      worker = null;
    }

    canvas = null;
    ctx = null;
    drawParams = null;
    isRunning.value = false;

    // ログが蓄積されていれば自動保存
    if (logs.value.length > 0) {
      void saveLogs().then(() => {
        logs.value = []; // 保存後にクリア
      });
    }

    logger.info('Capture stopped');
  };

  /**
   * テンプレート読み込み（互換性のため）
   */
  const ensureTemplatesLoaded = async () => {
    // Workerがモデルを処理するのでno-op
    logger.info('ensureTemplatesLoaded called (handled by worker)');
  };

  /**
   * ログをサーバーに保存（開発環境のみ）
   * キャプチャ終了時に自動で呼ばれる
   */
  const saveLogs = async () => {
    if (logs.value.length === 0) {
      logger.warn('No logs to download');
      return;
    }

    // テキストとして整形
    const logText = logs.value
      .map((entry) => {
        const date = new Date(entry.timestamp);
        const timeStr = date.toLocaleTimeString('ja-JP', { hour12: false });
        const msStr = String(date.getMilliseconds()).padStart(3, '0');
        return `[${timeStr}.${msStr}] [${entry.level.toUpperCase()}] ${entry.message}`;
      })
      .join('\n');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `screen-analysis-log_${timestamp}.txt`;

    // サーバーに保存を試みる（開発環境のみ有効）
    try {
      const response = await fetch('/api/debug/logs/screen-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: logText, filename }),
      });

      if (response.ok) {
        const result = await response.json();
        logger.info(`Logs saved to server: ${result.filepath}`);
        return;
      }
    } catch {
      // サーバー保存に失敗した場合はフォールバック
      logger.debug('Server save failed, falling back to browser download');
    }

    // フォールバック: ブラウザダウンロード
    const blob = new Blob([logText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    logger.info(`Downloaded ${logs.value.length} log entries (fallback)`);
  };

  /**
   * デバッグ画像をサーバーに保存（開発環境のみ）
   */
  const saveDebugImage = async (
    imageType: string,
    dataUrl: string,
    frameCount: number,
    timestamp: number,
    metadata?: {
      label?: string;
      confidence?: number;
      leftGold?: number;
      rightGold?: number;
    },
  ) => {
    try {
      const response = await fetch('/api/debug/images/screen-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageType,
          dataUrl,
          frameCount,
          timestamp,
          metadata,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        logger.debug(`Debug image saved: ${result.filepath}`);
      } else {
        logger.debug(`Failed to save debug image: ${response.status}`);
      }
    } catch {
      // サーバー保存に失敗しても無視（開発環境以外では正常）
      logger.debug('Debug image save skipped (server not available)');
    }
  };

  // ライフサイクル
  onMounted(() => {
    // Workerはキャプチャ開始時に初期化
  });

  onBeforeUnmount(() => {
    stopCapture();
  });

  return {
    // 状態（既存と互換）
    isRunning,
    errorMessage,
    lastResult,
    lastCoinResult,
    turnChoiceAvailable,
    turnChoiceEventId,
    resultEventId,
    resultLockState,
    lastScores,
    templateStatus,
    missingTemplates,
    templateErrors,

    // FSM状態（デバッグ用）
    fsmState: fsm.state,
    fsmPhase,

    // モデル状態
    modelStatus,

    // メソッド
    startCapture,
    stopCapture,
    resetState,
    ensureTemplatesLoaded,
    setAnalysisFps,
    currentFps: computed(() => currentFps.value),
  };
}
