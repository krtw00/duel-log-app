/**
 * Web Worker for template-matching screen analysis
 *
 * This worker handles:
 * - Template loading with MIPMAP generation for multiple resolutions
 * - Frame analysis using normalized cross-correlation (NCC)
 * - Consecutive detection logic (streak, cooldown, active period)
 * - Turn choice (coin toss) and result (win/lose) detection
 */

import {
  loadTemplateSetFromUrl,
  matchTemplateNcc,
  extractAndPreprocess,
  roiToRect,
  createCanvas,
  calculateScaledSigma,
  type TemplateSet,
  type CoinResult,
  type AnalysisResult,
} from '@/utils/screenAnalysis';
import type {
  TemplateWorkerMessage,
  TemplateWorkerResponse,
} from '@/workers/types';

// Logging helper for worker
const log = (level: 'info' | 'warn' | 'error', message: string, ...args: unknown[]) => {
  const timestamp = new Date().toISOString();
  console[level](`[ScreenAnalysisWorker ${timestamp}]`, message, ...args);
};

// Template sets
let coinWinTemplateSet: TemplateSet | null = null;
let coinLoseTemplateSet: TemplateSet | null = null;
let winTemplateSet: TemplateSet | null = null;
let loseTemplateSet: TemplateSet | null = null;

// Canvas for analysis
let canvas: OffscreenCanvas | null = null;
let ctx: OffscreenCanvasRenderingContext2D | null = null;

// Detection state
let turnChoiceStreak = 0;
let turnChoiceCandidate: CoinResult | null = null;
let resultStreak = 0;
let resultCandidate: AnalysisResult | null = null;
let turnChoiceCooldownUntil = 0;
let turnChoiceActiveUntil = 0;
let resultCooldownUntil = 0;
let resultLockState: 'locked' | 'unlocked' = 'unlocked';

// Event IDs
let turnChoiceEventId = 0;
let resultEventId = 0;

// Configuration
let config: {
  turnChoice: {
    winTemplateUrl: string;
    loseTemplateUrl: string;
    downscale: number;
    useEdge: boolean;
    blurSigma: number;
    templateBaseWidth: number;
    supportedHeights: number[];
    roi: { x: number; y: number; width: number; height: number };
    threshold: number;
    margin: number;
    stride: number;
    requiredStreak: number;
    cooldownMs: number;
    activeMs: number;
  };
  result: {
    winTemplateUrl: string;
    loseTemplateUrl: string;
    downscale: number;
    useEdge: boolean;
    blurSigma: number;
    templateBaseWidth: number;
    supportedHeights: number[];
    roi: { x: number; y: number; width: number; height: number };
    threshold: number;
    margin: number;
    stride: number;
    requiredStreak: number;
    cooldownMs: number;
  };
} | null = null;

// FPS for statistics
let currentFps = 5;

// Frame counter for periodic logging
let frameCount = 0;

/**
 * Find the best matching height from supported heights
 */
const findBestHeight = (currentHeight: number, supportedHeights: number[]): number => {
  return supportedHeights.reduce((prev, curr) => {
    return Math.abs(curr - currentHeight) < Math.abs(prev - currentHeight) ? curr : prev;
  });
};

/**
 * Initialize worker - load templates
 */
const handleInit = async (message: {
  type: 'init';
  config: NonNullable<typeof config>;
}): Promise<void> => {
  try {
    log('info', 'Initializing worker with config:', message.config);
    config = message.config;

    const loadMultiTemplate = async (
      url: string,
      options: {
        downscale: number;
        useEdge: boolean;
        blurSigma?: number;
        templateBaseWidth: number;
        supportedHeights: number[];
      },
    ): Promise<TemplateSet> => {
      return await loadTemplateSetFromUrl(url, options);
    };

    // Load all templates in parallel
    const [coinWin, coinLose, win, lose] = await Promise.all([
      loadMultiTemplate(config.turnChoice.winTemplateUrl, {
        downscale: config.turnChoice.downscale,
        useEdge: config.turnChoice.useEdge,
        blurSigma: config.turnChoice.blurSigma,
        templateBaseWidth: config.turnChoice.templateBaseWidth,
        supportedHeights: config.turnChoice.supportedHeights,
      }),
      loadMultiTemplate(config.turnChoice.loseTemplateUrl, {
        downscale: config.turnChoice.downscale,
        useEdge: config.turnChoice.useEdge,
        blurSigma: config.turnChoice.blurSigma,
        templateBaseWidth: config.turnChoice.templateBaseWidth,
        supportedHeights: config.turnChoice.supportedHeights,
      }),
      loadMultiTemplate(config.result.winTemplateUrl, {
        downscale: config.result.downscale,
        useEdge: config.result.useEdge,
        blurSigma: config.result.blurSigma,
        templateBaseWidth: config.result.templateBaseWidth,
        supportedHeights: config.result.supportedHeights,
      }),
      loadMultiTemplate(config.result.loseTemplateUrl, {
        downscale: config.result.downscale,
        useEdge: config.result.useEdge,
        blurSigma: config.result.blurSigma,
        templateBaseWidth: config.result.templateBaseWidth,
        supportedHeights: config.result.supportedHeights,
      }),
    ]);

    coinWinTemplateSet = coinWin;
    coinLoseTemplateSet = coinLose;
    winTemplateSet = win;
    loseTemplateSet = lose;

    log('info', 'Templates loaded:', {
      coinWin: Object.keys(coinWin),
      coinLose: Object.keys(coinLose),
      win: Object.keys(win),
      lose: Object.keys(lose),
    });

    const hasTemplates = (set: TemplateSet | null) => !!set && Object.keys(set).length > 0;

    const templateStatus = {
      coinWin: hasTemplates(coinWinTemplateSet),
      coinLose: hasTemplates(coinLoseTemplateSet),
      win: hasTemplates(winTemplateSet),
      lose: hasTemplates(loseTemplateSet),
    };

    const response: TemplateWorkerResponse = {
      type: 'init',
      success: true,
      templateStatus,
    };

    self.postMessage(response);
  } catch (error) {
    log('error', 'Failed to initialize worker:', error);
    const response: TemplateWorkerResponse = {
      type: 'init',
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load templates',
    };
    self.postMessage(response);
  }
};

/**
 * Analyze turn choice (coin toss)
 */
const analyzeTurnChoice = (now: number): {
  detected: boolean;
  result: CoinResult | null;
  eventId: number;
  available: boolean;
  scores: { coinWin: number; coinLose: number };
} => {
  const scores = { coinWin: 0, coinLose: 0 };

  if (!coinWinTemplateSet || !coinLoseTemplateSet || !ctx || !canvas || !config) {
    return { detected: false, result: null, eventId: turnChoiceEventId, available: false, scores };
  }

  if (now < turnChoiceCooldownUntil) {
    return { detected: false, result: null, eventId: turnChoiceEventId, available: false, scores };
  }

  const currentHeight = canvas.height;
  const bestHeight = findBestHeight(currentHeight, config.turnChoice.supportedHeights);

  const coinWinTemplate = coinWinTemplateSet[bestHeight.toString()];
  const coinLoseTemplate = coinLoseTemplateSet[bestHeight.toString()];

  if (!coinWinTemplate || !coinLoseTemplate) {
    if (frameCount % 25 === 1) {
      log('warn', 'analyzeTurnChoice: template not found for height', {
        currentHeight,
        bestHeight,
        availableKeys: Object.keys(coinWinTemplateSet),
      });
    }
    return { detected: false, result: null, eventId: turnChoiceEventId, available: false, scores };
  }

  const rect = roiToRect(config.turnChoice.roi, canvas.width, canvas.height);
  const scaledSigma = calculateScaledSigma(config.turnChoice.blurSigma, bestHeight);
  const image = extractAndPreprocess(ctx, rect, {
    downscale: config.turnChoice.downscale,
    useEdge: config.turnChoice.useEdge,
    blurSigma: scaledSigma,
  });

  const coinWinScore = matchTemplateNcc(image, coinWinTemplate, config.turnChoice.stride);
  const coinLoseScore = matchTemplateNcc(image, coinLoseTemplate, config.turnChoice.stride);

  scores.coinWin = coinWinScore;
  scores.coinLose = coinLoseScore;

  const bestScore = Math.max(coinWinScore, coinLoseScore);
  const margin = Math.abs(coinWinScore - coinLoseScore);

  if (bestScore < config.turnChoice.threshold) {
    turnChoiceStreak = 0;
    turnChoiceCandidate = null;
    return { detected: false, result: null, eventId: turnChoiceEventId, available: false, scores };
  }
  if (margin < config.turnChoice.margin) {
    turnChoiceStreak = 0;
    turnChoiceCandidate = null;
    return { detected: false, result: null, eventId: turnChoiceEventId, available: false, scores };
  }

  const candidate: CoinResult = coinWinScore >= coinLoseScore ? 'win' : 'lose';
  if (turnChoiceCandidate && turnChoiceCandidate !== candidate) {
    turnChoiceStreak = 0;
  }

  turnChoiceCandidate = candidate;
  turnChoiceStreak += 1;

  if (turnChoiceStreak >= config.turnChoice.requiredStreak) {
    turnChoiceStreak = 0;
    turnChoiceCandidate = null;
    turnChoiceActiveUntil = now + config.turnChoice.activeMs;
    turnChoiceCooldownUntil = now + config.turnChoice.cooldownMs;
    turnChoiceEventId += 1;
    resultLockState = 'unlocked';

    log('info', `Turn choice detected: ${candidate} (score: ${bestScore.toFixed(2)})`);

    return {
      detected: true,
      result: candidate,
      eventId: turnChoiceEventId,
      available: true,
      scores,
    };
  }

  return { detected: false, result: null, eventId: turnChoiceEventId, available: false, scores };
};

/**
 * Analyze result (win/lose)
 */
const analyzeResult = (
  now: number,
  turnChoiceAvailable: boolean,
): {
  detected: boolean;
  result: AnalysisResult | null;
  eventId: number;
  scores: { win: number; lose: number };
} => {
  const scores = { win: 0, lose: 0 };

  if (!winTemplateSet || !loseTemplateSet || !ctx || !canvas || !config) {
    return { detected: false, result: null, eventId: resultEventId, scores };
  }

  if (now < resultCooldownUntil) {
    return { detected: false, result: null, eventId: resultEventId, scores };
  }

  if (resultLockState === 'locked') {
    return { detected: false, result: null, eventId: resultEventId, scores };
  }

  if (turnChoiceAvailable) {
    return { detected: false, result: null, eventId: resultEventId, scores };
  }

  const currentHeight = canvas.height;
  const bestHeight = findBestHeight(currentHeight, config.result.supportedHeights);

  const winTemplate = winTemplateSet[bestHeight.toString()];
  const loseTemplate = loseTemplateSet[bestHeight.toString()];

  if (!winTemplate || !loseTemplate) {
    return { detected: false, result: null, eventId: resultEventId, scores };
  }

  const rect = roiToRect(config.result.roi, canvas.width, canvas.height);
  const scaledSigma = calculateScaledSigma(config.result.blurSigma, bestHeight);
  const image = extractAndPreprocess(ctx, rect, {
    downscale: config.result.downscale,
    useEdge: config.result.useEdge,
    blurSigma: scaledSigma,
  });

  const winScore = matchTemplateNcc(image, winTemplate, config.result.stride);
  const loseScore = matchTemplateNcc(image, loseTemplate, config.result.stride);

  scores.win = winScore;
  scores.lose = loseScore;

  const bestScore = Math.max(winScore, loseScore);
  const margin = Math.abs(winScore - loseScore);

  if (bestScore < config.result.threshold) {
    resultStreak = 0;
    resultCandidate = null;
    return { detected: false, result: null, eventId: resultEventId, scores };
  }
  if (margin < config.result.margin) {
    resultStreak = 0;
    resultCandidate = null;
    return { detected: false, result: null, eventId: resultEventId, scores };
  }

  const candidate: AnalysisResult = winScore >= loseScore ? 'win' : 'lose';
  if (resultCandidate && resultCandidate !== candidate) {
    resultStreak = 0;
  }

  resultCandidate = candidate;
  resultStreak += 1;

  if (resultStreak >= config.result.requiredStreak) {
    resultStreak = 0;
    resultCandidate = null;
    resultCooldownUntil = now + config.result.cooldownMs;
    resultEventId += 1;
    resultLockState = 'locked';

    log('info', `Result detected: ${candidate} (score: ${bestScore.toFixed(2)})`);

    return {
      detected: true,
      result: candidate,
      eventId: resultEventId,
      scores,
    };
  }

  return { detected: false, result: null, eventId: resultEventId, scores };
};

/**
 * Analyze frame
 */
const handleAnalyze = (message: {
  type: 'analyze';
  imageData: ImageData;
  timestamp: number;
}): void => {
  frameCount++;

  try {
    // Create canvas if not exists or size changed
    if (
      !canvas ||
      canvas.width !== message.imageData.width ||
      canvas.height !== message.imageData.height
    ) {
      canvas = new OffscreenCanvas(message.imageData.width, message.imageData.height);
      ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }
      log('info', `Canvas created: ${canvas.width}x${canvas.height}`);
    }

    // Draw image data to canvas
    ctx!.putImageData(message.imageData, 0, 0);

    const now = message.timestamp;

    // Check turn choice active period
    let turnChoiceAvailable = false;
    if (turnChoiceActiveUntil > 0 && now <= turnChoiceActiveUntil) {
      turnChoiceAvailable = true;
    }

    // Analyze turn choice
    const turnChoiceResult = analyzeTurnChoice(now);

    // Update available state
    if (turnChoiceResult.available) {
      turnChoiceAvailable = true;
    } else if (now > turnChoiceActiveUntil) {
      turnChoiceAvailable = false;
    }

    // Analyze result
    const matchResult = analyzeResult(now, turnChoiceAvailable);

    // Send response
    const response: TemplateWorkerResponse = {
      type: 'analysis',
      turnChoiceResult: {
        detected: turnChoiceResult.detected,
        result: turnChoiceResult.result,
        eventId: turnChoiceResult.eventId,
        available: turnChoiceAvailable,
      },
      matchResult: {
        detected: matchResult.detected,
        result: matchResult.result,
        eventId: matchResult.eventId,
      },
      scores: {
        coinWin: turnChoiceResult.scores.coinWin,
        coinLose: turnChoiceResult.scores.coinLose,
        win: matchResult.scores.win,
        lose: matchResult.scores.lose,
      },
      lockState: resultLockState,
    };

    self.postMessage(response);

    // Periodic logging
    if (frameCount % 25 === 1) {
      log(
        'info',
        `Frame ${frameCount}: ${canvas.width}x${canvas.height}, FPS: ${currentFps}, ` +
          `scores: ${JSON.stringify(response.scores)}`,
      );
    }
  } catch (error) {
    log('error', 'Failed to analyze frame:', error);
  }
};

/**
 * Reset state
 */
const handleReset = (): void => {
  turnChoiceStreak = 0;
  turnChoiceCandidate = null;
  resultStreak = 0;
  resultCandidate = null;
  turnChoiceCooldownUntil = 0;
  turnChoiceActiveUntil = 0;
  resultCooldownUntil = 0;
  // Don't reset resultLockState - it's reset by turn choice detection
  log('info', 'State reset');
};

/**
 * Set FPS (for statistics)
 */
const handleSetFps = (message: { type: 'setFps'; fps: number }): void => {
  currentFps = message.fps;
  log('info', `FPS set to ${currentFps}`);
};

/**
 * Message handler
 */
self.onmessage = (event: MessageEvent<TemplateWorkerMessage>) => {
  const message = event.data;

  switch (message.type) {
    case 'init':
      void handleInit(message);
      break;
    case 'analyze':
      handleAnalyze(message);
      break;
    case 'reset':
      handleReset();
      break;
    case 'setFps':
      handleSetFps(message);
      break;
    default:
      log('warn', 'Unknown message type:', message);
  }
};

log('info', 'Screen analysis worker started');
