/**
 * TensorFlow.js を使った画面キャプチャ解析
 *
 * 機械学習モデルによる画像分類で、コイントス結果と勝敗を判定する
 * 学習済みモデルがない場合は色ベースのヒューリスティックを使用
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { createLogger } from '@/utils/logger';
import { TFJS_CONFIG } from '@/utils/tfjsImageClassification';
import { createCanvas } from '@/utils/screenAnalysis';
import type { TfjsWorkerMessage, TfjsWorkerResponse } from '@/workers/types';

const logger = createLogger('ScreenCaptureAnalysisTfjs');

// 結果の型定義（既存と互換）
export type AnalysisResult = 'win' | 'lose';
export type CoinResult = 'win' | 'lose';
type ResultLockState = 'unlocked' | 'locked';

// 解析設定
const ANALYSIS_CONFIG = {
  scanFps: 5,
  normalizedWidth: 1280,
};

export function useScreenCaptureAnalysisTfjs() {
  // 状態
  const isRunning = ref(false);
  const errorMessage = ref<string | null>(null);
  const lastResult = ref<AnalysisResult | null>(null);
  const lastCoinResult = ref<CoinResult | null>(null);
  const turnChoiceAvailable = ref(false);
  const turnChoiceEventId = ref(0);
  const resultEventId = ref(0);
  const resultLockState = ref<ResultLockState>('unlocked');

  // 分類スコア（デバッグ用）
  const lastScores = ref({
    coinWin: 0,
    coinLose: 0,
    win: 0,
    lose: 0,
  });

  // 最後の予測ラベル（デバッグ用）
  const lastPredictedLabels = ref({
    coin: 'none',
    result: 'none',
  });

  // モデル状態
  const modelStatus = ref({
    tfjsReady: false,
    coinModelLoaded: false,
    resultModelLoaded: false,
    usingFallback: true,
  });

  // Worker-related state
  let worker: Worker | null = null;
  const currentFps = ref(ANALYSIS_CONFIG.scanFps);

  // キャプチャ関連
  let stream: MediaStream | null = null;
  let video: HTMLVideoElement | null = null;
  let canvas: HTMLCanvasElement | OffscreenCanvas | null = null;
  let ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null;
  let intervalId: number | null = null;
  let drawParams: { sx: number; sy: number; sWidth: number; sHeight: number } | null = null;

  // 不足テンプレート（互換性のため）
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

  // テンプレートエラー（互換性のため）
  const templateErrors = ref({
    coinWin: '',
    coinLose: '',
    win: '',
    lose: '',
  });

  const templateStatus = ref({
    coinWin: false,
    coinLose: false,
    win: false,
    lose: false,
  });

  /**
   * 状態リセット（次の対戦用）
   */
  const resetState = () => {
    lastResult.value = null;
    lastCoinResult.value = null;
    turnChoiceAvailable.value = false;
    lastScores.value = { coinWin: 0, coinLose: 0, win: 0, lose: 0 };

    // Worker にリセットを通知
    if (worker) {
      const message: TfjsWorkerMessage = { type: 'reset' };
      worker.postMessage(message);
    }
  };

  /**
   * 完全リセット（キャプチャ停止時）
   */
  const resetStateComplete = () => {
    resetState();
    turnChoiceEventId.value = 0;
    resultEventId.value = 0;
    resultLockState.value = 'unlocked';
  };

  /**
   * Worker メッセージハンドラを設定
   */
  const setupWorkerMessageHandler = () => {
    if (!worker) return;

    worker.onmessage = (event: MessageEvent<TfjsWorkerResponse>) => {
      const response = event.data;

      switch (response.type) {
        case 'init':
          if (response.success) {
            logger.info('Worker initialized successfully');
            if (response.modelStatus) {
              modelStatus.value = { ...response.modelStatus };
              // Update template status for compatibility
              templateStatus.value = {
                coinWin: true,
                coinLose: true,
                win: true,
                lose: true,
              };
            }
          } else {
            logger.error('Worker initialization failed:', response.error);
            errorMessage.value = response.error ?? 'Worker initialization failed';
          }
          break;

        case 'analysis':
          // Update scores
          lastScores.value = { ...response.scores };

          // Update predicted labels
          lastPredictedLabels.value = { ...response.predictedLabels };

          // Update coin result
          if (response.coinResult.detected) {
            lastCoinResult.value = response.coinResult.result;
            turnChoiceEventId.value = response.coinResult.eventId;
          }
          turnChoiceAvailable.value = response.coinResult.available;

          // Update match result
          if (response.matchResult.detected) {
            lastResult.value = response.matchResult.result;
            resultEventId.value = response.matchResult.eventId;
          }

          // Update lock state
          resultLockState.value = response.lockState;
          break;

        default:
          logger.warn('Unknown worker response type:', response);
      }
    };

    worker.onerror = (error) => {
      logger.error('Worker error:', error);
      errorMessage.value = 'Worker execution error';
      stopCapture();
    };
  };

  /**
   * Worker を初期化
   */
  const initWorker = async (): Promise<void> => {
    try {
      // Worker を作成
      worker = new Worker(new URL('../workers/screenAnalysisTfjs.worker.ts', import.meta.url), {
        type: 'module',
      });

      setupWorkerMessageHandler();

      // Worker に初期化メッセージを送信
      const message: TfjsWorkerMessage = {
        type: 'init',
        config: {
          coin: {
            modelUrl: TFJS_CONFIG.coin.modelUrl,
            inputSize: TFJS_CONFIG.coin.inputSize,
            labels: TFJS_CONFIG.coin.labels,
            threshold: TFJS_CONFIG.coin.threshold,
            roi: TFJS_CONFIG.coin.roi,
          },
          result: {
            modelUrl: TFJS_CONFIG.result.modelUrl,
            inputSize: TFJS_CONFIG.result.inputSize,
            labels: TFJS_CONFIG.result.labels,
            threshold: TFJS_CONFIG.result.threshold,
            roi: TFJS_CONFIG.result.roi,
          },
        },
      };

      worker.postMessage(message);

      logger.info('Worker initialization message sent');
    } catch (error) {
      logger.error('Failed to initialize worker:', error);
      throw error;
    }
  };

  /**
   * FPS を設定
   */
  const setAnalysisFps = (fps: number) => {
    currentFps.value = fps;

    // インターバル再設定
    if (intervalId !== null && isRunning.value) {
      window.clearInterval(intervalId);
      intervalId = window.setInterval(() => void analyzeFrame(), 1000 / fps);
    }

    // Worker に通知
    if (worker) {
      const message: TfjsWorkerMessage = { type: 'setFps', fps };
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

    // ビデオフレームを Canvas に描画
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

    // ImageData を取得して Worker に送信
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const message: TfjsWorkerMessage = {
      type: 'analyze',
      imageData,
      timestamp: Date.now(),
    };

    // Transferable Objects を使用してゼロコピー転送
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
      // Worker を初期化
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

      // 16:9 にクロップ
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

      drawParams = { sx, sy, sWidth, sHeight };

      // Canvas 作成
      const canvasWidth = sWidth;
      const canvasHeight = sHeight;
      canvas = createCanvas(canvasWidth, canvasHeight);
      ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        throw new Error('Failed to initialize canvas context');
      }

      logger.info(`Starting TF.js capture at resolution: ${canvasWidth}x${canvasHeight}`);

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

    logger.info('Capture stopped');
  };

  /**
   * テンプレート読み込み（互換性のため）
   */
  const ensureTemplatesLoaded = async () => {
    // Worker handles model loading, so this is a no-op
    // Keep for compatibility with existing code
    logger.info('ensureTemplatesLoaded called (handled by worker)');
  };

  /**
   * Canvas を Blob に変換するヘルパー
   */
  const canvasToBlob = async (
    targetCanvas: HTMLCanvasElement | OffscreenCanvas,
  ): Promise<Blob | null> => {
    if (targetCanvas instanceof HTMLCanvasElement) {
      return new Promise((resolve) => {
        targetCanvas.toBlob((blob) => resolve(blob), 'image/png');
      });
    } else if (targetCanvas instanceof OffscreenCanvas) {
      return await targetCanvas.convertToBlob({ type: 'image/png' });
    }
    return null;
  };

  // File System Access API 用のディレクトリハンドル
  let trainingDataDirHandle: FileSystemDirectoryHandle | null = null;

  /**
   * 学習データ保存先フォルダを選択
   */
  const selectTrainingDataFolder = async (): Promise<boolean> => {
    try {
      // @ts-expect-error - File System Access API
      trainingDataDirHandle = await window.showDirectoryPicker({
        mode: 'readwrite',
      });
      logger.info(`Training data folder selected: ${trainingDataDirHandle?.name}`);
      return true;
    } catch (error) {
      logger.error('Failed to select training data folder:', error);
      return false;
    }
  };

  /**
   * サブディレクトリを取得または作成
   */
  const getOrCreateSubDir = async (
    parentHandle: FileSystemDirectoryHandle,
    name: string,
  ): Promise<FileSystemDirectoryHandle> => {
    return await parentHandle.getDirectoryHandle(name, { create: true });
  };

  /**
   * ファイルを保存
   */
  const saveFileToDir = async (
    dirHandle: FileSystemDirectoryHandle,
    filename: string,
    blob: Blob,
  ): Promise<boolean> => {
    try {
      const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
      return true;
    } catch (error) {
      logger.error(`Failed to save file ${filename}:`, error);
      return false;
    }
  };

  /**
   * Blob をダウンロード（フォールバック用）
   */
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /**
   * 学習データ保存先が設定済みか
   */
  const hasTrainingDataFolder = () => trainingDataDirHandle !== null;

  /**
   * デバッグ用: 現在のフレームとROI領域を保存
   * 学習データ収集に使用
   */
  const saveDebugImages = async (
    label: 'coin-win' | 'coin-lose' | 'coin-none' | 'result-win' | 'result-lose' | 'result-none',
  ) => {
    if (!canvas || !ctx) {
      logger.warn('Cannot save debug images: canvas not ready');
      return null;
    }

    const timestamp = Date.now();
    let savedCount = 0;

    try {
      // ROI を抽出
      const roiConfig = label.startsWith('coin') ? TFJS_CONFIG.coin : TFJS_CONFIG.result;
      const rect = {
        x: Math.round(roiConfig.roi.x * canvas.width),
        y: Math.round(roiConfig.roi.y * canvas.height),
        width: Math.round(roiConfig.roi.width * canvas.width),
        height: Math.round(roiConfig.roi.height * canvas.height),
      };
      const roiImageData = ctx.getImageData(rect.x, rect.y, rect.width, rect.height);

      // ROI を HTMLCanvas に描画
      const roiHtmlCanvas = document.createElement('canvas');
      roiHtmlCanvas.width = roiImageData.width;
      roiHtmlCanvas.height = roiImageData.height;
      const roiCtx = roiHtmlCanvas.getContext('2d');
      if (!roiCtx) {
        logger.error('Failed to create ROI canvas context');
        return 0;
      }
      roiCtx.putImageData(roiImageData, 0, 0);
      const roiBlob = await canvasToBlob(roiHtmlCanvas);

      if (!roiBlob) {
        logger.error('Failed to create ROI blob');
        return 0;
      }

      // File System Access API が使える場合は直接保存
      if (trainingDataDirHandle) {
        // ラベルからディレクトリ構造を決定
        // coin-win -> coin/win, result-lose -> result/lose
        const [category, className] = label.split('-') as [string, string];
        const categoryDir = await getOrCreateSubDir(trainingDataDirHandle, category);
        const classDir = await getOrCreateSubDir(
          categoryDir,
          className === 'win' && category === 'result' ? 'victory' : className,
        );

        // ROI のみ保存（学習に使用）
        const roiFilename = `${className}_${timestamp}.png`;
        if (await saveFileToDir(classDir, roiFilename, roiBlob)) {
          savedCount++;
          logger.info(`Saved to ${category}/${className}/${roiFilename}`);
        }
      } else {
        // フォールバック: ダウンロード
        downloadBlob(roiBlob, `${label}_${timestamp}_roi.png`);
        savedCount++;
      }

      logger.info(`Debug images captured: ${label} (${savedCount} images)`);
    } catch (error) {
      logger.error('Failed to save debug images:', error);
    }

    return savedCount;
  };

  // ライフサイクル
  onMounted(() => {
    // Worker will load models when initialized
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

    // TF.js 固有
    modelStatus,
    lastPredictedLabels,

    // メソッド
    startCapture,
    stopCapture,
    resetState,
    ensureTemplatesLoaded,
    saveDebugImages,
    selectTrainingDataFolder,
    hasTrainingDataFolder,

    // New exports
    setAnalysisFps,
    currentFps: computed(() => currentFps.value),
  };
}
