/**
 * 画面解析Composable
 *
 * TensorFlow.jsによる画面解析を提供
 * FSMはメインスレッドで管理し、Vue DevToolsでデバッグ可能
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { createLogger } from '@/utils/logger';
import {
  createFSM,
  FSM_CONFIG,
  WORKER_CONFIG,
  ANALYSIS_CONFIG,
  ROI_CONFIG,
  type WorkerMessage,
  type WorkerResponse,
  type DetectionScores,
  type ModelStatus,
  type CoinResult,
  type MatchResult,
} from '@/utils/screenAnalysis/index';
import { createCanvas } from '@/utils/screenAnalysis';

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
          if (response.success) {
            logger.info('Worker initialized successfully');
            if (response.modelStatus) {
              modelStatus.value = { ...response.modelStatus };
              // 互換性のためtemplate statusも更新
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
            fsm.setError(response.error ?? 'Worker initialization failed');
          }
          break;

        case 'scores': {
          // スコアを更新
          lastScores.value = { ...response.scores };

          // FSMでスコアを処理
          const event = fsm.processScores(response.scores);

          // 検出イベントを処理
          if (event?.type === 'coinDetected') {
            lastCoinResult.value = event.result;
            logger.info(`Coin detected: ${event.result}`);
          }
          if (event?.type === 'resultDetected') {
            lastResult.value = event.result;
            logger.info(`Result detected: ${event.result}`);
          }
          break;
        }

        case 'error':
          logger.error('Worker error:', response.error);
          errorMessage.value = response.error;
          fsm.setError(response.error);
          break;

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
  const initWorker = async (): Promise<void> => {
    try {
      // Workerを作成
      worker = new Worker(new URL('../workers/screenAnalysisML.worker.ts', import.meta.url), {
        type: 'module',
      });

      setupWorkerMessageHandler();

      // Workerに初期化メッセージを送信
      const message: WorkerMessage = {
        type: 'init',
        config: WORKER_CONFIG,
      };

      worker.postMessage(message);

      logger.info('Worker initialization message sent');
    } catch (error) {
      logger.error('Failed to initialize worker:', error);
      throw error;
    }
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

      drawParams = { sx, sy, sWidth, sHeight };

      // Canvas作成
      const canvasWidth = sWidth;
      const canvasHeight = sHeight;
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
   * CanvasをBlobに変換するヘルパー
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

  // File System Access API用のディレクトリハンドル
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
   * Blobをダウンロード（フォールバック用）
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
      // ROIを抽出
      const roiConfig = label.startsWith('coin') ? ROI_CONFIG.coin : ROI_CONFIG.result;
      const rect = {
        x: Math.round(roiConfig.x * canvas.width),
        y: Math.round(roiConfig.y * canvas.height),
        width: Math.round(roiConfig.width * canvas.width),
        height: Math.round(roiConfig.height * canvas.height),
      };
      const roiImageData = ctx.getImageData(rect.x, rect.y, rect.width, rect.height);

      // ROIをHTMLCanvasに描画
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

      // File System Access APIが使える場合は直接保存
      if (trainingDataDirHandle) {
        const [category, className] = label.split('-') as [string, string];
        const categoryDir = await getOrCreateSubDir(trainingDataDirHandle, category);
        const classDir = await getOrCreateSubDir(
          categoryDir,
          className === 'win' && category === 'result' ? 'victory' : className,
        );

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
    saveDebugImages,
    selectTrainingDataFolder,
    hasTrainingDataFolder,
    setAnalysisFps,
    currentFps: computed(() => currentFps.value),
  };
}
