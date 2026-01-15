import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { createLogger } from '@/utils/logger';
import { useLocale } from './useLocale';
import {
  AnalysisResult,
  CoinResult,
  SCREEN_ANALYSIS_CONFIG,
  calculateScaledSigma,
  createCanvas,
  extractAndPreprocess,
  loadTemplateSetFromUrl,
  matchTemplateNcc,
  roiToRect,
  TemplateSet,
} from '@/utils/screenAnalysis';

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

  let stream: MediaStream | null = null;
  let video: HTMLVideoElement | null = null;
  let canvas: HTMLCanvasElement | OffscreenCanvas | null = null;
  let ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null;
  let intervalId: number | null = null;
  let drawParams: { sx: number; sy: number; sWidth: number; sHeight: number } | null = null;

  let coinWinTemplateSet: TemplateSet | null = null;
  let coinLoseTemplateSet: TemplateSet | null = null;
  let winTemplateSet: TemplateSet | null = null;
  let loseTemplateSet: TemplateSet | null = null;

  let turnChoiceStreak = 0;
  let turnChoiceCandidate: CoinResult | null = null;
  let resultStreak = 0;
  let resultCandidate: AnalysisResult | null = null;
  let turnChoiceCooldownUntil = 0;
  let turnChoiceActiveUntil = 0;
  let resultCooldownUntil = 0;

  // 次の対戦のためにフォームリセット時に呼ばれる（ロック状態は維持）
  const resetState = () => {
    lastResult.value = null;
    lastCoinResult.value = null;
    turnChoiceAvailable.value = false;
    lastScores.value = { coinWin: 0, coinLose: 0, win: 0, lose: 0 };
    turnChoiceStreak = 0;
    turnChoiceCandidate = null;
    resultStreak = 0;
    resultCandidate = null;
    turnChoiceCooldownUntil = 0;
    turnChoiceActiveUntil = 0;
    resultCooldownUntil = 0;
    // resultLockStateはリセットしない（コイントス検出でのみアンロック）
  };

  // キャプチャ停止時など完全リセット
  const resetStateComplete = () => {
    resetState();
    turnChoiceEventId.value = 0;
    resultEventId.value = 0;
    resultLockState.value = 'unlocked';
  };

  const updateTemplateStatus = (next: TemplateStatus) => {
    templateStatus.value = { ...next };
  };

  const loadTemplates = async () => {
    const loadMultiTemplate = async (
      key: keyof TemplateStatus,
      url: string,
      options: {
        downscale: number;
        useEdge: boolean;
        blurSigma?: number;
        templateBaseWidth: number;
        supportedHeights: number[];
      },
    ) => {
      try {
        const templateSet = await loadTemplateSetFromUrl(url, options);
        return { key, templateSet, error: '' };
      } catch (error) {
        const message = error instanceof Error ? error.message : (LL.value?.common.screenCapture.templateLoadError() ?? 'Failed to load template');
        return { key, templateSet: null, error: message };
      }
    };

    const [coinWin, coinLose, win, lose] = await Promise.all([
      loadMultiTemplate('coinWin', SCREEN_ANALYSIS_CONFIG.turnChoice.winTemplateUrl, {
        downscale: SCREEN_ANALYSIS_CONFIG.turnChoice.downscale,
        useEdge: SCREEN_ANALYSIS_CONFIG.turnChoice.useEdge,
        blurSigma: SCREEN_ANALYSIS_CONFIG.turnChoice.blurSigma,
        templateBaseWidth: SCREEN_ANALYSIS_CONFIG.turnChoice.templateBaseWidth,
        supportedHeights: SCREEN_ANALYSIS_CONFIG.turnChoice.supportedHeights,
      }),
      loadMultiTemplate('coinLose', SCREEN_ANALYSIS_CONFIG.turnChoice.loseTemplateUrl, {
        downscale: SCREEN_ANALYSIS_CONFIG.turnChoice.downscale,
        useEdge: SCREEN_ANALYSIS_CONFIG.turnChoice.useEdge,
        blurSigma: SCREEN_ANALYSIS_CONFIG.turnChoice.blurSigma,
        templateBaseWidth: SCREEN_ANALYSIS_CONFIG.turnChoice.templateBaseWidth,
        supportedHeights: SCREEN_ANALYSIS_CONFIG.turnChoice.supportedHeights,
      }),
      loadMultiTemplate('win', SCREEN_ANALYSIS_CONFIG.result.winTemplateUrl, {
        downscale: SCREEN_ANALYSIS_CONFIG.result.downscale,
        useEdge: SCREEN_ANALYSIS_CONFIG.result.useEdge,
        blurSigma: SCREEN_ANALYSIS_CONFIG.result.blurSigma,
        templateBaseWidth: SCREEN_ANALYSIS_CONFIG.result.templateBaseWidth,
        supportedHeights: SCREEN_ANALYSIS_CONFIG.result.supportedHeights,
      }),
      loadMultiTemplate('lose', SCREEN_ANALYSIS_CONFIG.result.loseTemplateUrl, {
        downscale: SCREEN_ANALYSIS_CONFIG.result.downscale,
        useEdge: SCREEN_ANALYSIS_CONFIG.result.useEdge,
        blurSigma: SCREEN_ANALYSIS_CONFIG.result.blurSigma,
        templateBaseWidth: SCREEN_ANALYSIS_CONFIG.result.templateBaseWidth,
        supportedHeights: SCREEN_ANALYSIS_CONFIG.result.supportedHeights,
      }),
    ]);

    coinWinTemplateSet = coinWin.templateSet;
    coinLoseTemplateSet = coinLose.templateSet;
    winTemplateSet = win.templateSet;
    loseTemplateSet = lose.templateSet;

    // デバッグログ
    logger.info('Templates loaded:', {
      coinWin: coinWin.templateSet ? Object.keys(coinWin.templateSet) : null,
      coinLose: coinLose.templateSet ? Object.keys(coinLose.templateSet) : null,
      win: win.templateSet ? Object.keys(win.templateSet) : null,
      lose: lose.templateSet ? Object.keys(lose.templateSet) : null,
      errors: {
        coinWin: coinWin.error,
        coinLose: coinLose.error,
        win: win.error,
        lose: lose.error,
      },
    });

    const hasTemplates = (set: TemplateSet | null) => !!set && Object.keys(set).length > 0;

    updateTemplateStatus({
      coinWin: hasTemplates(coinWinTemplateSet),
      coinLose: hasTemplates(coinLoseTemplateSet),
      win: hasTemplates(winTemplateSet),
      lose: hasTemplates(loseTemplateSet),
    });

    templateErrors.value = {
      coinWin: coinWin.error,
      coinLose: coinLose.error,
      win: win.error,
      lose: lose.error,
    };

    templatesLoaded.value =
      hasTemplates(coinWinTemplateSet) &&
      hasTemplates(coinLoseTemplateSet) &&
      hasTemplates(winTemplateSet) &&
      hasTemplates(loseTemplateSet) &&
      !coinWin.error &&
      !coinLose.error &&
      !win.error &&
      !lose.error;
  };

  const ensureTemplatesLoaded = async () => {
    if (templatesLoaded.value) return;
    await loadTemplates();
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

    canvas = null;
    ctx = null;
    drawParams = null;
    isRunning.value = false;
  };

  const findBestHeight = (currentHeight: number, supportedHeights: number[]): number => {
    return supportedHeights.reduce((prev, curr) => {
      return Math.abs(curr - currentHeight) < Math.abs(prev - currentHeight) ? curr : prev;
    });
  };

  const analyzeTurnChoice = (now: number) => {
    if (!coinWinTemplateSet || !coinLoseTemplateSet || !ctx || !canvas) {
      if (frameCount % 25 === 1) {
        logger.warn('analyzeTurnChoice: missing templates or context', {
          hasCoinWin: !!coinWinTemplateSet,
          hasCoinLose: !!coinLoseTemplateSet,
          hasCtx: !!ctx,
          hasCanvas: !!canvas,
        });
      }
      return;
    }
    if (now < turnChoiceCooldownUntil) return;

    const currentHeight = canvas.height;
    const bestHeight = findBestHeight(
      currentHeight,
      SCREEN_ANALYSIS_CONFIG.turnChoice.supportedHeights,
    );

    const coinWinTemplate = coinWinTemplateSet[bestHeight.toString()];
    const coinLoseTemplate = coinLoseTemplateSet[bestHeight.toString()];

    if (!coinWinTemplate || !coinLoseTemplate) {
      if (frameCount % 25 === 1) {
        logger.warn('analyzeTurnChoice: template not found for height', {
          currentHeight,
          bestHeight,
          availableKeys: Object.keys(coinWinTemplateSet),
        });
      }
      return;
    }

    const rect = roiToRect(SCREEN_ANALYSIS_CONFIG.turnChoice.roi, canvas.width, canvas.height);
    const scaledSigma = calculateScaledSigma(
      SCREEN_ANALYSIS_CONFIG.turnChoice.blurSigma,
      bestHeight,
    );
    const image = extractAndPreprocess(ctx, rect, {
      downscale: SCREEN_ANALYSIS_CONFIG.turnChoice.downscale,
      useEdge: SCREEN_ANALYSIS_CONFIG.turnChoice.useEdge,
      blurSigma: scaledSigma,
    });

    if (frameCount === 1) {
      const canMatch =
        image.width >= coinWinTemplate.width && image.height >= coinWinTemplate.height;
      logger.info(
        `analyzeTurnChoice: height=${canvas.height}->best=${bestHeight}, rect=${rect.width}x${rect.height}, image=${image.width}x${image.height}, template=${coinWinTemplate.width}x${coinWinTemplate.height}, canMatch=${canMatch}`,
      );
      // テンプレート統計情報をログ出力（std=0だとマッチング不可能）
      logger.info(
        `coinWin template stats: mean=${coinWinTemplate.mean.toFixed(2)}, std=${coinWinTemplate.std.toFixed(2)}, maskSum=${coinWinTemplate.maskSum.toFixed(0)}`,
      );
      logger.info(
        `coinLose template stats: mean=${coinLoseTemplate.mean.toFixed(2)}, std=${coinLoseTemplate.std.toFixed(2)}, maskSum=${coinLoseTemplate.maskSum.toFixed(0)}`,
      );

      // 画像ROIの輝度分布を確認（デバッグ用）
      let minVal = 255,
        maxVal = 0;
      for (let i = 0; i < image.data.length; i++) {
        if (image.data[i] < minVal) minVal = image.data[i];
        if (image.data[i] > maxVal) maxVal = image.data[i];
      }
      logger.info(`image ROI luminance range: ${minVal.toFixed(0)} - ${maxVal.toFixed(0)}`);
    }

    const coinWinScore = matchTemplateNcc(
      image,
      coinWinTemplate,
      SCREEN_ANALYSIS_CONFIG.turnChoice.stride,
    );
    const coinLoseScore = matchTemplateNcc(
      image,
      coinLoseTemplate,
      SCREEN_ANALYSIS_CONFIG.turnChoice.stride,
    );
    lastScores.value = { ...lastScores.value, coinWin: coinWinScore, coinLose: coinLoseScore };

    const bestScore = Math.max(coinWinScore, coinLoseScore);
    const margin = Math.abs(coinWinScore - coinLoseScore);

    if (bestScore < SCREEN_ANALYSIS_CONFIG.turnChoice.threshold) {
      turnChoiceStreak = 0;
      turnChoiceCandidate = null;
      return;
    }
    if (margin < SCREEN_ANALYSIS_CONFIG.turnChoice.margin) {
      turnChoiceStreak = 0;
      turnChoiceCandidate = null;
      return;
    }

    const candidate: CoinResult = coinWinScore >= coinLoseScore ? 'win' : 'lose';
    if (turnChoiceCandidate && turnChoiceCandidate !== candidate) {
      turnChoiceStreak = 0;
    }

    turnChoiceCandidate = candidate;
    turnChoiceStreak += 1;

    if (turnChoiceStreak >= SCREEN_ANALYSIS_CONFIG.turnChoice.requiredStreak) {
      lastCoinResult.value = candidate;
      turnChoiceStreak = 0;
      turnChoiceCandidate = null;
      turnChoiceAvailable.value = true;
      turnChoiceActiveUntil = now + SCREEN_ANALYSIS_CONFIG.turnChoice.activeMs;
      turnChoiceCooldownUntil = now + SCREEN_ANALYSIS_CONFIG.turnChoice.cooldownMs;
      turnChoiceEventId.value += 1;
      // コイントス判定が成功したら戦績登録のロックを解除
      resultLockState.value = 'unlocked';
    }
  };

  const analyzeResult = (now: number) => {
    if (!winTemplateSet || !loseTemplateSet || !ctx || !canvas) return;
    if (now < resultCooldownUntil) return;
    // ロック中は戦績判定をスキップ
    if (resultLockState.value === 'locked') return;
    // コイントス判定がアクティブな間は戦績判定をスキップ（誤判定防止）
    if (turnChoiceAvailable.value) return;

    const currentHeight = canvas.height;
    const bestHeight = findBestHeight(
      currentHeight,
      SCREEN_ANALYSIS_CONFIG.result.supportedHeights,
    );

    const winTemplate = winTemplateSet[bestHeight.toString()];
    const loseTemplate = loseTemplateSet[bestHeight.toString()];

    if (!winTemplate || !loseTemplate) {
      // 最適なテンプレートが見つからない場合は何もしない
      return;
    }

    const rect = roiToRect(SCREEN_ANALYSIS_CONFIG.result.roi, canvas.width, canvas.height);
    const scaledSigma = calculateScaledSigma(SCREEN_ANALYSIS_CONFIG.result.blurSigma, bestHeight);
    const image = extractAndPreprocess(ctx, rect, {
      downscale: SCREEN_ANALYSIS_CONFIG.result.downscale,
      useEdge: SCREEN_ANALYSIS_CONFIG.result.useEdge,
      blurSigma: scaledSigma,
    });

    if (frameCount === 1) {
      logger.info(
        `analyzeResult: rect=${rect.width}x${rect.height}, image=${image.width}x${image.height}, winTemplate=${winTemplate.width}x${winTemplate.height}, loseTemplate=${loseTemplate.width}x${loseTemplate.height}`,
      );
      // テンプレート統計情報をログ出力（std=0だとマッチング不可能）
      logger.info(
        `win template stats: mean=${winTemplate.mean.toFixed(2)}, std=${winTemplate.std.toFixed(2)}, maskSum=${winTemplate.maskSum.toFixed(0)}`,
      );
      logger.info(
        `lose template stats: mean=${loseTemplate.mean.toFixed(2)}, std=${loseTemplate.std.toFixed(2)}, maskSum=${loseTemplate.maskSum.toFixed(0)}`,
      );
    }

    const winScore = matchTemplateNcc(image, winTemplate, SCREEN_ANALYSIS_CONFIG.result.stride);
    const loseScore = matchTemplateNcc(image, loseTemplate, SCREEN_ANALYSIS_CONFIG.result.stride);
    lastScores.value = { ...lastScores.value, win: winScore, lose: loseScore };

    const bestScore = Math.max(winScore, loseScore);
    const margin = Math.abs(winScore - loseScore);
    if (bestScore < SCREEN_ANALYSIS_CONFIG.result.threshold) {
      resultStreak = 0;
      resultCandidate = null;
      return;
    }
    if (margin < SCREEN_ANALYSIS_CONFIG.result.margin) {
      resultStreak = 0;
      resultCandidate = null;
      return;
    }

    const candidate: AnalysisResult = winScore >= loseScore ? 'win' : 'lose';
    if (resultCandidate && resultCandidate !== candidate) {
      resultStreak = 0;
    }

    resultCandidate = candidate;
    resultStreak += 1;

    if (resultStreak >= SCREEN_ANALYSIS_CONFIG.result.requiredStreak) {
      lastResult.value = candidate;
      resultEventId.value += 1;
      resultStreak = 0;
      resultCandidate = null;
      resultCooldownUntil = now + SCREEN_ANALYSIS_CONFIG.result.cooldownMs;
      // 戦績登録後はロックをかけ、次のコイントス判定まで登録しない
      resultLockState.value = 'locked';
    }
  };

  let frameCount = 0;
  const analyzeFrame = () => {
    frameCount++;
    if (frameCount === 1) {
      logger.info(`analyzeFrame called: ctx=${!!ctx}, canvas=${!!canvas}, video=${!!video}`);
    }
    if (!ctx || !canvas || !video) {
      if (frameCount <= 3) {
        logger.warn(
          `analyzeFrame early return: ctx=${!!ctx}, canvas=${!!canvas}, video=${!!video}`,
        );
      }
      return;
    }
    if (frameCount % 25 === 1) {
      logger.info(
        `Frame ${frameCount}: canvas=${canvas.width}x${canvas.height}, templatesLoaded=${templatesLoaded.value}, scores=${JSON.stringify(lastScores.value)}`,
      );
    }
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
    const now = Date.now();

    if (turnChoiceAvailable.value && now > turnChoiceActiveUntil) {
      turnChoiceAvailable.value = false;
    }

    analyzeTurnChoice(now);
    analyzeResult(now);
  };

  const startCapture = async () => {
    if (isRunning.value) return;
    errorMessage.value = null;
    resetStateComplete();

    try {
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: SCREEN_ANALYSIS_CONFIG.scanFps,
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

      // テンプレートを読み込み（MIPMAPアプローチで全解像度用を生成）
      // バックグラウンドで読み込み - 読み込み完了前でもキャプチャは開始する
      logger.info(`Starting capture at resolution: ${canvasWidth}x${canvasHeight}`);
      void ensureTemplatesLoaded();

      const track = stream.getVideoTracks()[0];
      track.addEventListener('ended', () => {
        stopCapture();
      });

      isRunning.value = true;
      const intervalMs = 1000 / SCREEN_ANALYSIS_CONFIG.scanFps;
      logger.info(
        `Setting up analysis interval: ${intervalMs}ms (${SCREEN_ANALYSIS_CONFIG.scanFps} FPS)`,
      );
      intervalId = window.setInterval(analyzeFrame, intervalMs);
    } catch (error) {
      logger.error('Failed to start capture', error);
      errorMessage.value = LL.value?.common.screenCapture.startError() ?? 'Failed to start screen sharing';
      stopCapture();
    }
  };

  onBeforeUnmount(() => {
    stopCapture();
  });

  onMounted(() => {
    void ensureTemplatesLoaded();
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
  };
}
