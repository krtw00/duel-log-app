import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { createLogger } from '@/utils/logger';
import {
  AnalysisResult,
  CoinResult,
  SCREEN_ANALYSIS_CONFIG,
  createCanvas,
  extractAndPreprocess,
  loadTemplateSetFromUrl,
  matchTemplateNcc,
  roiToRect,
  TemplateSet,
} from '@/utils/screenAnalysis';

const logger = createLogger('ScreenCaptureAnalysis');

type TemplateStatus = {
  coinWin: boolean;
  coinLose: boolean;
  okButton: boolean;
  win: boolean;
  lose: boolean;
};
type TemplateErrors = {
  coinWin: string;
  coinLose: string;
  okButton: string;
  win: string;
  lose: string;
};

export function useScreenCaptureAnalysis() {
  const isRunning = ref(false);
  const errorMessage = ref<string | null>(null);
  const lastResult = ref<AnalysisResult | null>(null);
  const lastCoinResult = ref<CoinResult | null>(null);
  const turnChoiceAvailable = ref(false);
  const okButtonAvailable = ref(false);
  const turnChoiceEventId = ref(0);
  const resultEventId = ref(0);
  const lastScores = ref({ coinWin: 0, coinLose: 0, okButton: 0, win: 0, lose: 0 });

  const templateStatus = ref<TemplateStatus>({
    coinWin: false,
    coinLose: false,
    okButton: false,
    win: false,
    lose: false,
  });
  const templateErrors = ref<TemplateErrors>({
    coinWin: '',
    coinLose: '',
    okButton: '',
    win: '',
    lose: '',
  });
  const templatesLoaded = ref(false);

  const missingTemplates = computed(() => {
    const missing: string[] = [];
    if (!templateStatus.value.coinWin) missing.push('coin-win');
    if (!templateStatus.value.coinLose) missing.push('coin-lose');
    if (!templateStatus.value.okButton) missing.push('ok-button');
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
  let okButtonTemplateSet: TemplateSet | null = null;
  let winTemplateSet: TemplateSet | null = null;
  let loseTemplateSet: TemplateSet | null = null;

  let turnChoiceStreak = 0;
  let turnChoiceCandidate: CoinResult | null = null;
  let okButtonStreak = 0;
  let resultStreak = 0;
  let resultCandidate: AnalysisResult | null = null;
  let turnChoiceCooldownUntil = 0;
  let turnChoiceActiveUntil = 0;
  let okButtonCooldownUntil = 0;
  let okButtonActiveUntil = 0;
  let resultCooldownUntil = 0;

  const resetState = () => {
    lastResult.value = null;
    lastCoinResult.value = null;
    turnChoiceAvailable.value = false;
    okButtonAvailable.value = false;
    lastScores.value = { coinWin: 0, coinLose: 0, okButton: 0, win: 0, lose: 0 };
    turnChoiceStreak = 0;
    turnChoiceCandidate = null;
    okButtonStreak = 0;
    resultStreak = 0;
    resultCandidate = null;
    turnChoiceCooldownUntil = 0;
    turnChoiceActiveUntil = 0;
    okButtonCooldownUntil = 0;
    okButtonActiveUntil = 0;
    resultCooldownUntil = 0;
    turnChoiceEventId.value = 0;
    resultEventId.value = 0;
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
        templateBaseWidth: number;
        supportedHeights: number[];
      },
    ) => {
      try {
        const templateSet = await loadTemplateSetFromUrl(url, options);
        return { key, templateSet, error: '' };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'テンプレセット読み込み失敗';
        return { key, templateSet: null, error: message };
      }
    };

    const [coinWin, coinLose, okButton, win, lose] = await Promise.all([
      loadMultiTemplate('coinWin', SCREEN_ANALYSIS_CONFIG.turnChoice.winTemplateUrl, {
        downscale: SCREEN_ANALYSIS_CONFIG.turnChoice.downscale,
        useEdge: SCREEN_ANALYSIS_CONFIG.turnChoice.useEdge,
        templateBaseWidth: SCREEN_ANALYSIS_CONFIG.turnChoice.templateBaseWidth,
        supportedHeights: SCREEN_ANALYSIS_CONFIG.turnChoice.supportedHeights,
      }),
      loadMultiTemplate('coinLose', SCREEN_ANALYSIS_CONFIG.turnChoice.loseTemplateUrl, {
        downscale: SCREEN_ANALYSIS_CONFIG.turnChoice.downscale,
        useEdge: SCREEN_ANALYSIS_CONFIG.turnChoice.useEdge,
        templateBaseWidth: SCREEN_ANALYSIS_CONFIG.turnChoice.templateBaseWidth,
        supportedHeights: SCREEN_ANALYSIS_CONFIG.turnChoice.supportedHeights,
      }),
      loadMultiTemplate('okButton', SCREEN_ANALYSIS_CONFIG.okButton.templateUrl, {
        downscale: SCREEN_ANALYSIS_CONFIG.okButton.downscale,
        useEdge: SCREEN_ANALYSIS_CONFIG.okButton.useEdge,
        templateBaseWidth: SCREEN_ANALYSIS_CONFIG.okButton.templateBaseWidth,
        supportedHeights: SCREEN_ANALYSIS_CONFIG.okButton.supportedHeights,
      }),
      loadMultiTemplate('win', SCREEN_ANALYSIS_CONFIG.result.winTemplateUrl, {
        downscale: SCREEN_ANALYSIS_CONFIG.result.downscale,
        useEdge: SCREEN_ANALYSIS_CONFIG.result.useEdge,
        templateBaseWidth: SCREEN_ANALYSIS_CONFIG.result.templateBaseWidth,
        supportedHeights: SCREEN_ANALYSIS_CONFIG.result.supportedHeights,
      }),
      loadMultiTemplate('lose', SCREEN_ANALYSIS_CONFIG.result.loseTemplateUrl, {
        downscale: SCREEN_ANALYSIS_CONFIG.result.downscale,
        useEdge: SCREEN_ANALYSIS_CONFIG.result.useEdge,
        templateBaseWidth: SCREEN_ANALYSIS_CONFIG.result.templateBaseWidth,
        supportedHeights: SCREEN_ANALYSIS_CONFIG.result.supportedHeights,
      }),
    ]);

    coinWinTemplateSet = coinWin.templateSet;
    coinLoseTemplateSet = coinLose.templateSet;
    okButtonTemplateSet = okButton.templateSet;
    winTemplateSet = win.templateSet;
    loseTemplateSet = lose.templateSet;

    const hasTemplates = (set: TemplateSet | null) => !!set && Object.keys(set).length > 0;

    updateTemplateStatus({
      coinWin: hasTemplates(coinWinTemplateSet),
      coinLose: hasTemplates(coinLoseTemplateSet),
      okButton: hasTemplates(okButtonTemplateSet),
      win: hasTemplates(winTemplateSet),
      lose: hasTemplates(loseTemplateSet),
    });

    templateErrors.value = {
      coinWin: coinWin.error,
      coinLose: coinLose.error,
      okButton: okButton.error,
      win: win.error,
      lose: lose.error,
    };

    templatesLoaded.value =
      hasTemplates(coinWinTemplateSet) &&
      hasTemplates(coinLoseTemplateSet) &&
      hasTemplates(okButtonTemplateSet) &&
      hasTemplates(winTemplateSet) &&
      hasTemplates(loseTemplateSet) &&
      !coinWin.error &&
      !coinLose.error &&
      !okButton.error &&
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
    if (!coinWinTemplateSet || !coinLoseTemplateSet || !ctx || !canvas) return;
    if (now < turnChoiceCooldownUntil) return;

    const currentHeight = canvas.height;
    const bestHeight = findBestHeight(
      currentHeight,
      SCREEN_ANALYSIS_CONFIG.turnChoice.supportedHeights,
    );

    const coinWinTemplate = coinWinTemplateSet[bestHeight.toString()];
    const coinLoseTemplate = coinLoseTemplateSet[bestHeight.toString()];

    if (!coinWinTemplate || !coinLoseTemplate) return;

    const rect = roiToRect(SCREEN_ANALYSIS_CONFIG.turnChoice.roi, canvas.width, canvas.height);
    const image = extractAndPreprocess(ctx, rect, {
      downscale: SCREEN_ANALYSIS_CONFIG.turnChoice.downscale,
      useEdge: SCREEN_ANALYSIS_CONFIG.turnChoice.useEdge,
    });

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
    }
  };

  const analyzeOkButton = (now: number) => {
    if (!okButtonTemplateSet || !ctx || !canvas) return;
    if (now < okButtonCooldownUntil) return;

    const currentHeight = canvas.height;
    const bestHeight = findBestHeight(
      currentHeight,
      SCREEN_ANALYSIS_CONFIG.okButton.supportedHeights,
    );

    const okButtonTemplate = okButtonTemplateSet[bestHeight.toString()];

    if (!okButtonTemplate) return;

    const rect = roiToRect(SCREEN_ANALYSIS_CONFIG.okButton.roi, canvas.width, canvas.height);
    const image = extractAndPreprocess(ctx, rect, {
      downscale: SCREEN_ANALYSIS_CONFIG.okButton.downscale,
      useEdge: SCREEN_ANALYSIS_CONFIG.okButton.useEdge,
    });

    const score = matchTemplateNcc(image, okButtonTemplate, SCREEN_ANALYSIS_CONFIG.okButton.stride);
    lastScores.value = { ...lastScores.value, okButton: score };

    if (score >= SCREEN_ANALYSIS_CONFIG.okButton.threshold) {
      okButtonStreak += 1;
    } else {
      okButtonStreak = 0;
    }

    if (okButtonStreak >= SCREEN_ANALYSIS_CONFIG.okButton.requiredStreak) {
      okButtonStreak = 0;
      okButtonAvailable.value = true;
      okButtonActiveUntil = now + SCREEN_ANALYSIS_CONFIG.okButton.activeMs;
      okButtonCooldownUntil = now + SCREEN_ANALYSIS_CONFIG.okButton.cooldownMs;
    }
  };

  const analyzeResult = (now: number) => {
    if (!winTemplateSet || !loseTemplateSet || !ctx || !canvas) return;
    if (now < resultCooldownUntil) return;

    const currentHeight = canvas.height;
    const bestHeight = findBestHeight(currentHeight, SCREEN_ANALYSIS_CONFIG.result.supportedHeights);

    const winTemplate = winTemplateSet[bestHeight.toString()];
    const loseTemplate = loseTemplateSet[bestHeight.toString()];

    if (!winTemplate || !loseTemplate) {
      // 最適なテンプレートが見つからない場合は何もしない
      return;
    }

    const rect = roiToRect(SCREEN_ANALYSIS_CONFIG.result.roi, canvas.width, canvas.height);
    const image = extractAndPreprocess(ctx, rect, {
      downscale: SCREEN_ANALYSIS_CONFIG.result.downscale,
      useEdge: SCREEN_ANALYSIS_CONFIG.result.useEdge,
    });

    const winScore = matchTemplateNcc(image, winTemplate, SCREEN_ANALYSIS_CONFIG.result.stride);
    const loseScore = matchTemplateNcc(image, loseTemplate, SCREEN_ANALYSIS_CONFIG.result.stride);
    lastScores.value = { ...lastScores.value, win: winScore, lose: loseScore };

    if (!okButtonAvailable.value) {
      resultStreak = 0;
      resultCandidate = null;
      return;
    }

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
    }
  };

  const analyzeFrame = () => {
    if (!ctx || !canvas || !video) return;
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
    if (okButtonAvailable.value && now > okButtonActiveUntil) {
      okButtonAvailable.value = false;
    }

    analyzeTurnChoice(now);
    analyzeOkButton(now);
    analyzeResult(now);
  };

  const startCapture = async () => {
    if (isRunning.value) return;
    errorMessage.value = null;
    resetState();

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
      logger.info(`Starting capture at resolution: ${canvasWidth}x${canvasHeight}`);
      await loadTemplates();

      const track = stream.getVideoTracks()[0];
      track.addEventListener('ended', () => {
        stopCapture();
      });

      isRunning.value = true;
      intervalId = window.setInterval(analyzeFrame, 1000 / SCREEN_ANALYSIS_CONFIG.scanFps);
    } catch (error) {
      logger.error('Failed to start capture', error);
      errorMessage.value = '画面共有の開始に失敗しました';
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
    okButtonAvailable,
    turnChoiceEventId,
    resultEventId,
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
