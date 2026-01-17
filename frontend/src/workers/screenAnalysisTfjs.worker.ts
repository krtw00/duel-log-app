/**
 * Web Worker for TensorFlow.js-based screen analysis
 *
 * This worker handles:
 * - TensorFlow.js initialization and model loading
 * - Frame analysis using ML models or color histogram fallback
 * - Consecutive detection logic (streak, cooldown, active period)
 * - Coin toss and result (win/lose) detection
 */

import {
  initTfjs,
  ImageClassifier,
  resizeImageData,
  classifyByColorHistogram,
  MODEL_INPUT_SIZE,
} from '@/utils/tfjsImageClassification';
import { roiToRect } from '@/utils/screenAnalysis';
import type { CoinResult, AnalysisResult } from '@/utils/screenAnalysis';
import type { TfjsWorkerMessage, TfjsWorkerResponse } from '@/workers/types';

// Logging helper for worker
const log = (level: 'info' | 'warn' | 'error', message: string, ...args: unknown[]) => {
  const timestamp = new Date().toISOString();
  console[level](`[ScreenAnalysisTfjsWorker ${timestamp}]`, message, ...args);
};

// Canvas for analysis
let canvas: OffscreenCanvas | null = null;
let ctx: OffscreenCanvasRenderingContext2D | null = null;

// Classifiers
let coinClassifier: ImageClassifier | null = null;
let resultClassifier: ImageClassifier | null = null;

// Detection state
let coinStreak = 0;
let coinCandidate: CoinResult | null = null;
let resultStreak = 0;
let resultCandidate: AnalysisResult | null = null;
let coinCooldownUntil = 0;
let coinActiveUntil = 0;
let resultCooldownUntil = 0;
let resultLockState: 'locked' | 'unlocked' = 'unlocked';

// Event IDs
let coinEventId = 0;
let resultEventId = 0;

// Model status
let tfjsReady = false;
let coinModelLoaded = false;
let resultModelLoaded = false;
let usingFallback = true;

// Configuration
let config: {
  coin: {
    modelUrl: string;
    inputSize: number;
    labels: string[];
    threshold: number;
    roi: { x: number; y: number; width: number; height: number };
  };
  result: {
    modelUrl: string;
    inputSize: number;
    labels: string[];
    threshold: number;
    roi: { x: number; y: number; width: number; height: number };
  };
} | null = null;

// Analysis configuration
const ANALYSIS_CONFIG = {
  coin: {
    requiredStreak: 5,
    cooldownMs: 15000,
    activeMs: 20000,
  },
  result: {
    requiredStreak: 3,
    cooldownMs: 12000,
  },
  // Color heuristics for fallback
  colorHeuristics: {
    coin: {
      win: { rgb: [255, 215, 0] as [number, number, number], tolerance: 80 },
      lose: { rgb: [192, 192, 192] as [number, number, number], tolerance: 80 },
    },
    result: {
      victory: { rgb: [255, 200, 50] as [number, number, number], tolerance: 100 },
      lose: { rgb: [100, 100, 180] as [number, number, number], tolerance: 100 },
    },
  },
};

// FPS for statistics
let currentFps = 5;

// Frame counter
let frameCount = 0;

/**
 * Initialize worker - load TensorFlow.js and models
 */
const handleInit = async (message: {
  type: 'init';
  config: NonNullable<typeof config>;
}): Promise<void> => {
  try {
    log('info', 'Initializing TensorFlow.js worker with config:', message.config);
    config = message.config;

    // Initialize TensorFlow.js
    await initTfjs();
    tfjsReady = true;
    log('info', 'TensorFlow.js initialized');

    // Initialize coin classifier
    coinClassifier = new ImageClassifier(config.coin);
    coinModelLoaded = await coinClassifier.load();

    // Initialize result classifier
    resultClassifier = new ImageClassifier(config.result);
    resultModelLoaded = await resultClassifier.load();

    // Use fallback if models failed to load
    usingFallback = !coinModelLoaded || !resultModelLoaded;

    if (usingFallback) {
      log('info', 'Using color heuristics fallback (models not available)');
    }

    const response: TfjsWorkerResponse = {
      type: 'init',
      success: true,
      modelStatus: {
        tfjsReady,
        coinModelLoaded,
        resultModelLoaded,
        usingFallback,
      },
    };

    self.postMessage(response);
  } catch (error) {
    log('error', 'Failed to initialize worker:', error);
    const response: TfjsWorkerResponse = {
      type: 'init',
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initialize TensorFlow.js',
    };
    self.postMessage(response);
  }
};

/**
 * Classify ROI using ML model or color histogram fallback
 */
const classifyRoi = async (
  roiRatio: { x: number; y: number; width: number; height: number },
  classifier: ImageClassifier | null,
  colorConfig: { label: string; rgb: [number, number, number]; tolerance: number }[],
): Promise<{ label: string; confidence: number }> => {
  if (!ctx || !canvas) {
    return { label: 'none', confidence: 0 };
  }

  // Extract ROI
  const rect = roiToRect(roiRatio, canvas.width, canvas.height);
  const imageData = ctx.getImageData(rect.x, rect.y, rect.width, rect.height);

  // Use ML model if loaded
  if (classifier?.isLoaded && !usingFallback) {
    const resized = resizeImageData(imageData, MODEL_INPUT_SIZE);
    const result = await classifier.classify(resized);
    return result || { label: 'none', confidence: 0 };
  }

  // Fallback: color histogram-based classification
  return classifyByColorHistogram(imageData, {
    targetColors: colorConfig,
  });
};

/**
 * Analyze coin toss
 */
const analyzeCoin = async (now: number): Promise<{
  detected: boolean;
  result: CoinResult | null;
  eventId: number;
  available: boolean;
  scores: { coinWin: number; coinLose: number };
  predictedLabel: string;
}> => {
  const scores = { coinWin: 0, coinLose: 0 };
  let predictedLabel = 'none';

  if (!ctx || !canvas || !config) {
    return {
      detected: false,
      result: null,
      eventId: coinEventId,
      available: false,
      scores,
      predictedLabel,
    };
  }

  // Always classify for score display
  const result = await classifyRoi(config.coin.roi, coinClassifier, [
    { label: 'win', ...ANALYSIS_CONFIG.colorHeuristics.coin.win },
    { label: 'lose', ...ANALYSIS_CONFIG.colorHeuristics.coin.lose },
  ]);

  predictedLabel = result.label;

  // Update scores
  if (result.label === 'win') {
    scores.coinWin = result.confidence;
    scores.coinLose = 0;
  } else if (result.label === 'lose') {
    scores.coinWin = 0;
    scores.coinLose = result.confidence;
  } else {
    scores.coinWin = result.confidence;
    scores.coinLose = 0;
  }

  // Check blocking conditions
  if (now < coinCooldownUntil) {
    return {
      detected: false,
      result: null,
      eventId: coinEventId,
      available: false,
      scores,
      predictedLabel,
    };
  }

  // Threshold check
  if (result.confidence < config.coin.threshold || result.label === 'none') {
    coinStreak = 0;
    coinCandidate = null;
    return {
      detected: false,
      result: null,
      eventId: coinEventId,
      available: false,
      scores,
      predictedLabel,
    };
  }

  const candidate = result.label as CoinResult;
  if (coinCandidate && coinCandidate !== candidate) {
    coinStreak = 0;
  }

  coinCandidate = candidate;
  coinStreak += 1;

  if (coinStreak >= ANALYSIS_CONFIG.coin.requiredStreak) {
    coinStreak = 0;
    coinCandidate = null;
    coinActiveUntil = now + ANALYSIS_CONFIG.coin.activeMs;
    coinCooldownUntil = now + ANALYSIS_CONFIG.coin.cooldownMs;
    coinEventId += 1;
    resultLockState = 'unlocked';

    log('info', `Coin result detected: ${candidate} (confidence: ${result.confidence.toFixed(2)})`);

    return {
      detected: true,
      result: candidate,
      eventId: coinEventId,
      available: true,
      scores,
      predictedLabel,
    };
  }

  return {
    detected: false,
    result: null,
    eventId: coinEventId,
    available: false,
    scores,
    predictedLabel,
  };
};

/**
 * Analyze result (win/lose)
 */
const analyzeResult = async (
  now: number,
  coinAvailable: boolean,
): Promise<{
  detected: boolean;
  result: AnalysisResult | null;
  eventId: number;
  scores: { win: number; lose: number };
  predictedLabel: string;
}> => {
  const scores = { win: 0, lose: 0 };
  let predictedLabel = 'none';

  if (!ctx || !canvas || !config) {
    return {
      detected: false,
      result: null,
      eventId: resultEventId,
      scores,
      predictedLabel,
    };
  }

  // Always classify for score display
  const result = await classifyRoi(config.result.roi, resultClassifier, [
    { label: 'victory', ...ANALYSIS_CONFIG.colorHeuristics.result.victory },
    { label: 'lose', ...ANALYSIS_CONFIG.colorHeuristics.result.lose },
  ]);

  predictedLabel = result.label;

  // Update scores (victory -> win)
  if (result.label === 'victory') {
    scores.win = result.confidence;
    scores.lose = 0;
  } else if (result.label === 'lose') {
    scores.win = 0;
    scores.lose = result.confidence;
  } else {
    scores.win = result.confidence;
    scores.lose = 0;
  }

  // Check blocking conditions
  if (now < resultCooldownUntil) {
    return { detected: false, result: null, eventId: resultEventId, scores, predictedLabel };
  }
  if (resultLockState === 'locked') {
    return { detected: false, result: null, eventId: resultEventId, scores, predictedLabel };
  }
  if (coinAvailable) {
    return { detected: false, result: null, eventId: resultEventId, scores, predictedLabel };
  }

  // Threshold check
  if (result.confidence < config.result.threshold || result.label === 'none') {
    resultStreak = 0;
    resultCandidate = null;
    return { detected: false, result: null, eventId: resultEventId, scores, predictedLabel };
  }

  // victory -> win conversion
  const candidate: AnalysisResult = result.label === 'victory' ? 'win' : 'lose';
  if (resultCandidate && resultCandidate !== candidate) {
    resultStreak = 0;
  }

  resultCandidate = candidate;
  resultStreak += 1;

  if (resultStreak >= ANALYSIS_CONFIG.result.requiredStreak) {
    resultStreak = 0;
    resultCandidate = null;
    resultCooldownUntil = now + ANALYSIS_CONFIG.result.cooldownMs;
    resultEventId += 1;
    resultLockState = 'locked';

    log('info', `Result detected: ${candidate} (confidence: ${result.confidence.toFixed(2)})`);

    return {
      detected: true,
      result: candidate,
      eventId: resultEventId,
      scores,
      predictedLabel,
    };
  }

  return { detected: false, result: null, eventId: resultEventId, scores, predictedLabel };
};

/**
 * Analyze frame
 */
const handleAnalyze = async (message: {
  type: 'analyze';
  imageData: ImageData;
  timestamp: number;
}): Promise<void> => {
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
    // ctx is guaranteed to be non-null here due to the check above
    ctx!.putImageData(message.imageData, 0, 0);

    const now = message.timestamp;

    // Check coin active period
    let coinAvailable = false;
    if (coinActiveUntil > 0 && now <= coinActiveUntil) {
      coinAvailable = true;
    }

    // Analyze coin
    const coinResult = await analyzeCoin(now);

    // Update available state
    if (coinResult.available) {
      coinAvailable = true;
    } else if (now > coinActiveUntil) {
      coinAvailable = false;
    }

    // Analyze result
    const matchResult = await analyzeResult(now, coinAvailable);

    // Send response
    const response: TfjsWorkerResponse = {
      type: 'analysis',
      coinResult: {
        detected: coinResult.detected,
        result: coinResult.result,
        eventId: coinResult.eventId,
        available: coinAvailable,
      },
      matchResult: {
        detected: matchResult.detected,
        result: matchResult.result,
        eventId: matchResult.eventId,
      },
      scores: {
        coinWin: coinResult.scores.coinWin,
        coinLose: coinResult.scores.coinLose,
        win: matchResult.scores.win,
        lose: matchResult.scores.lose,
      },
      predictedLabels: {
        coin: coinResult.predictedLabel,
        result: matchResult.predictedLabel,
      },
      lockState: resultLockState,
    };

    self.postMessage(response);

    // Periodic logging
    if (frameCount % 25 === 1) {
      log(
        'info',
        `Frame ${frameCount}: ${canvas.width}x${canvas.height}, FPS: ${currentFps}, ` +
          `fallback: ${usingFallback}, scores: ${JSON.stringify(response.scores)}`,
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
  coinStreak = 0;
  coinCandidate = null;
  resultStreak = 0;
  resultCandidate = null;
  coinCooldownUntil = 0;
  coinActiveUntil = 0;
  resultCooldownUntil = 0;
  // Don't reset resultLockState - it's reset by coin detection
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
self.onmessage = (event: MessageEvent<TfjsWorkerMessage>) => {
  const message = event.data;

  switch (message.type) {
    case 'init':
      void handleInit(message);
      break;
    case 'analyze':
      void handleAnalyze(message);
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

log('info', 'TensorFlow.js analysis worker started');
