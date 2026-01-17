import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { createLogger } from '@/utils/logger';
import { useLocale } from './useLocale';
import { AnalysisResult, CoinResult, SCREEN_ANALYSIS_CONFIG, createCanvas } from '@/utils/screenAnalysis';
import type {
  TemplateWorkerMessage,
  TemplateWorkerResponse,
} from '@/workers/types';

// 戦績登録のロック状態を管理する型
type ResultLockState = 'unlocked' | 'locked';

const logger = createLogger('ScreenCaptureAnalysis');

type TemplateStatus = {
  coinWin: boolean;
  coinLose: boolean;
  win: boolean;
  lose: boolean;
};
type TemplateErrors = {
  coinWin: string;
  coinLose: string;
  win: string;
  lose: string;
};

export function useScreenCaptureAnalysis() {
  const { LL } = useLocale();
  const isRunning = ref(false);
  const errorMessage = ref<string | null>(null);
  const lastResult = ref<AnalysisResult | null>(null);
  const lastCoinResult = ref<CoinResult | null>(null);
  const turnChoiceAvailable = ref(false);
  const turnChoiceEventId = ref(0);
  const resultEventId = ref(0);
  const lastScores = ref({ coinWin: 0, coinLose: 0, win: 0, lose: 0 });
  // 戦績登録のロック状態（コイントス判定でアンロック）
  const resultLockState = ref<ResultLockState>('unlocked');

  const templateStatus = ref<TemplateStatus>({
    coinWin: false,
    coinLose: false,
    win: false,
    lose: false,
  });
  const templateErrors = ref<TemplateErrors>({
    coinWin: '',
    coinLose: '',
    win: '',
    lose: '',
  });
  const templatesLoaded = ref(false);

  const missingTemplates = computed(() => {
    const missing: string[] = [];
    if (!templateStatus.value.coinWin) missing.push('coin-win');
    if (!templateStatus.value.coinLose) missing.push('coin-lose');
    if (!templateStatus.value.win) missing.push('result-win');
    if (!templateStatus.value.lose) missing.push('result-lose');
    return missing;
  });

  // Worker-related state
  let worker: Worker | null = null;
  const currentFps = ref(SCREEN_ANALYSIS_CONFIG.scanFps);

  let stream: MediaStream | null = null;
  let video: HTMLVideoElement | null = null;
  let canvas: HTMLCanvasElement | OffscreenCanvas | null = null;
  let ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null;
  let intervalId: number | null = null;
  let drawParams: { sx: number; sy: number; sWidth: number; sHeight: number } | null = null;

  // 次の対戦のためにフォームリセット時に呼ばれる（ロック状態は維持）
  const resetState = () => {
    lastResult.value = null;
    lastCoinResult.value = null;
    turnChoiceAvailable.value = false;
    lastScores.value = { coinWin: 0, coinLose: 0, win: 0, lose: 0 };

    // Worker にリセットを通知
    if (worker) {
      const message: TemplateWorkerMessage = { type: 'reset' };
      worker.postMessage(message);
    }
  };

  // キャプチャ停止時など完全リセット
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

    worker.onmessage = (event: MessageEvent<TemplateWorkerResponse>) => {
      const response = event.data;

      switch (response.type) {
        case 'init':
          if (response.success) {
            logger.info('Worker initialized successfully');
            if (response.templateStatus) {
              templateStatus.value = { ...response.templateStatus };
              templatesLoaded.value =
                response.templateStatus.coinWin &&
                response.templateStatus.coinLose &&
                response.templateStatus.win &&
                response.templateStatus.lose;
            }
          } else {
            logger.error('Worker initialization failed:', response.error);
            errorMessage.value = response.error ?? 'Worker initialization failed';
            templateErrors.value = {
              coinWin: response.error ?? '',
              coinLose: response.error ?? '',
              win: response.error ?? '',
              lose: response.error ?? '',
            };
          }
          break;

        case 'analysis':
          // Update scores
          lastScores.value = { ...response.scores };

          // Update turn choice result
          if (response.turnChoiceResult.detected) {
            lastCoinResult.value = response.turnChoiceResult.result;
            turnChoiceEventId.value = response.turnChoiceResult.eventId;
          }
          turnChoiceAvailable.value = response.turnChoiceResult.available;

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
      worker = new Worker(
        new URL('../workers/screenAnalysis.worker.ts', import.meta.url),
        { type: 'module' }
      );

      setupWorkerMessageHandler();

      // Worker に初期化メッセージを送信
      const message: TemplateWorkerMessage = {
        type: 'init',
        config: {
          turnChoice: {
            winTemplateUrl: SCREEN_ANALYSIS_CONFIG.turnChoice.winTemplateUrl,
            loseTemplateUrl: SCREEN_ANALYSIS_CONFIG.turnChoice.loseTemplateUrl,
            downscale: SCREEN_ANALYSIS_CONFIG.turnChoice.downscale,
            useEdge: SCREEN_ANALYSIS_CONFIG.turnChoice.useEdge,
            blurSigma: SCREEN_ANALYSIS_CONFIG.turnChoice.blurSigma,
            templateBaseWidth: SCREEN_ANALYSIS_CONFIG.turnChoice.templateBaseWidth,
            supportedHeights: SCREEN_ANALYSIS_CONFIG.turnChoice.supportedHeights,
            roi: SCREEN_ANALYSIS_CONFIG.turnChoice.roi,
            threshold: SCREEN_ANALYSIS_CONFIG.turnChoice.threshold,
            margin: SCREEN_ANALYSIS_CONFIG.turnChoice.margin,
            stride: SCREEN_ANALYSIS_CONFIG.turnChoice.stride,
            requiredStreak: SCREEN_ANALYSIS_CONFIG.turnChoice.requiredStreak,
            cooldownMs: SCREEN_ANALYSIS_CONFIG.turnChoice.cooldownMs,
            activeMs: SCREEN_ANALYSIS_CONFIG.turnChoice.activeMs,
          },
          result: {
            winTemplateUrl: SCREEN_ANALYSIS_CONFIG.result.winTemplateUrl,
            loseTemplateUrl: SCREEN_ANALYSIS_CONFIG.result.loseTemplateUrl,
            downscale: SCREEN_ANALYSIS_CONFIG.result.downscale,
            useEdge: SCREEN_ANALYSIS_CONFIG.result.useEdge,
            blurSigma: SCREEN_ANALYSIS_CONFIG.result.blurSigma,
            templateBaseWidth: SCREEN_ANALYSIS_CONFIG.result.templateBaseWidth,
            supportedHeights: SCREEN_ANALYSIS_CONFIG.result.supportedHeights,
            roi: SCREEN_ANALYSIS_CONFIG.result.roi,
            threshold: SCREEN_ANALYSIS_CONFIG.result.threshold,
            margin: SCREEN_ANALYSIS_CONFIG.result.margin,
            stride: SCREEN_ANALYSIS_CONFIG.result.stride,
            requiredStreak: SCREEN_ANALYSIS_CONFIG.result.requiredStreak,
            cooldownMs: SCREEN_ANALYSIS_CONFIG.result.cooldownMs,
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
      intervalId = window.setInterval(analyzeFrame, 1000 / fps);
    }

    // Worker に通知
    if (worker) {
      const message: TemplateWorkerMessage = { type: 'setFps', fps };
      worker.postMessage(message);
    }

    logger.info(`Analysis FPS set to ${fps}`);
  };

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
  };

  const analyzeFrame = () => {
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

    const message: TemplateWorkerMessage = {
      type: 'analyze',
      imageData,
      timestamp: Date.now(),
    };

    // Transferable Objects を使用してゼロコピー転送
    worker.postMessage(message, [imageData.data.buffer]);
  };

  const startCapture = async () => {
    if (isRunning.value) return;
    errorMessage.value = null;
    resetStateComplete();

    try {
      // Worker を初期化
      await initWorker();

      stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: currentFps.value,
        },
        audio: false,
      });

      video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      await video.play();

      const videoWidth = video.videoWidth || SCREEN_ANALYSIS_CONFIG.normalizedWidth;
      const videoHeight = video.videoHeight || Math.round((videoWidth * 9) / 16);

      // 16:9にクロップしたサイズを計算
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

      // 実際のビデオ解像度でキャンバスを作成（16:9クロップ後のサイズ）
      const canvasWidth = sWidth;
      const canvasHeight = sHeight;
      canvas = createCanvas(canvasWidth, canvasHeight);
      ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        throw new Error('Failed to initialize canvas context');
      }

      logger.info(`Starting capture at resolution: ${canvasWidth}x${canvasHeight}`);

      const track = stream.getVideoTracks()[0];
      track.addEventListener('ended', () => {
        stopCapture();
      });

      isRunning.value = true;
      const intervalMs = 1000 / currentFps.value;
      logger.info(`Setting up analysis interval: ${intervalMs}ms (${currentFps.value} FPS)`);
      intervalId = window.setInterval(analyzeFrame, intervalMs);
    } catch (error) {
      logger.error('Failed to start capture', error);
      errorMessage.value =
        LL.value?.common.screenCapture.startError() ?? 'Failed to start screen sharing';
      stopCapture();
    }
  };

  const ensureTemplatesLoaded = async () => {
    // Worker handles template loading, so this is a no-op
    // Keep for compatibility with existing code
    logger.info('ensureTemplatesLoaded called (handled by worker)');
  };

  onBeforeUnmount(() => {
    stopCapture();
  });

  onMounted(() => {
    // Worker will load templates when initialized
  });

  return {
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
    startCapture,
    stopCapture,
    resetState,
    ensureTemplatesLoaded,
    // New exports
    setAnalysisFps,
    currentFps: computed(() => currentFps.value),
  };
}
