/**
 * 画面解析ML分類Worker
 *
 * TensorFlow.jsによる画像分類のみを担当
 * FSMロジックはメインスレッドで処理
 */

import {
  initTfjs,
  ImageClassifier,
  resizeImageData,
  classifyByColorHistogram,
  MODEL_INPUT_SIZE,
} from '@/utils/tfjsImageClassification';
import { roiToRect } from '@/utils/screenAnalysis';
import type {
  WorkerMessage,
  WorkerResponse,
  WorkerConfig,
  DetectionScores,
} from '@/utils/screenAnalysis/types';

// ログ出力ヘルパー
const log = (level: 'info' | 'warn' | 'error', message: string, ...args: unknown[]) => {
  const timestamp = new Date().toISOString();
  console[level](`[ScreenAnalysisMLWorker ${timestamp}]`, message, ...args);
};

// Canvas
let canvas: OffscreenCanvas | null = null;
let ctx: OffscreenCanvasRenderingContext2D | null = null;

// 分類器
let coinClassifier: ImageClassifier | null = null;
let resultClassifier: ImageClassifier | null = null;

// モデル状態
let tfjsReady = false;
let coinModelLoaded = false;
let resultModelLoaded = false;
let usingFallback = true;

// 設定
let config: WorkerConfig | null = null;

// FPS（統計用）
let currentFps = 5;

// フレームカウンタ
let frameCount = 0;

// 色ヒューリスティック（フォールバック用）
const COLOR_HEURISTICS = {
  coin: {
    win: { rgb: [255, 215, 0] as [number, number, number], tolerance: 80 },
    lose: { rgb: [192, 192, 192] as [number, number, number], tolerance: 80 },
  },
  result: {
    victory: { rgb: [255, 200, 50] as [number, number, number], tolerance: 100 },
    lose: { rgb: [100, 100, 180] as [number, number, number], tolerance: 100 },
  },
};

/**
 * 初期化処理
 */
const handleInit = async (message: { type: 'init'; config: WorkerConfig }): Promise<void> => {
  try {
    log('info', 'Initializing ML worker with config:', message.config);
    config = message.config;

    // TensorFlow.js初期化
    await initTfjs();
    tfjsReady = true;
    log('info', 'TensorFlow.js initialized');

    // コイン分類器を初期化
    coinClassifier = new ImageClassifier(config.coin);
    coinModelLoaded = await coinClassifier.load();

    // 勝敗分類器を初期化
    resultClassifier = new ImageClassifier(config.result);
    resultModelLoaded = await resultClassifier.load();

    // フォールバック判定
    usingFallback = !coinModelLoaded || !resultModelLoaded;

    if (usingFallback) {
      log('info', 'Using color heuristics fallback (models not available)');
    }

    const response: WorkerResponse = {
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
    const response: WorkerResponse = {
      type: 'init',
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initialize TensorFlow.js',
    };
    self.postMessage(response);
  }
};

/**
 * ROIを分類
 */
const classifyRoi = async (
  roiRatio: { x: number; y: number; width: number; height: number },
  classifier: ImageClassifier | null,
  colorConfig: { label: string; rgb: [number, number, number]; tolerance: number }[],
): Promise<{ label: string; confidence: number }> => {
  if (!ctx || !canvas) {
    return { label: 'none', confidence: 0 };
  }

  // ROI抽出
  const rect = roiToRect(roiRatio, canvas.width, canvas.height);
  const imageData = ctx.getImageData(rect.x, rect.y, rect.width, rect.height);

  // MLモデルがロード済みの場合
  if (classifier?.isLoaded && !usingFallback) {
    const resized = resizeImageData(imageData, MODEL_INPUT_SIZE);
    const result = await classifier.classify(resized);
    return result || { label: 'none', confidence: 0 };
  }

  // フォールバック: 色ヒストグラムベースの分類
  return classifyByColorHistogram(imageData, {
    targetColors: colorConfig,
  });
};

/**
 * フレーム解析
 */
const handleAnalyze = async (message: {
  type: 'analyze';
  imageData: ImageData;
  timestamp: number;
}): Promise<void> => {
  frameCount++;

  try {
    // Canvasが存在しない、またはサイズが変わった場合は再作成
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

    // 画像データをCanvasに描画
    ctx!.putImageData(message.imageData, 0, 0);

    if (!config) {
      throw new Error('Config not initialized');
    }

    // コイン分類
    const coinResult = await classifyRoi(config.coin.roi, coinClassifier, [
      { label: 'win', ...COLOR_HEURISTICS.coin.win },
      { label: 'lose', ...COLOR_HEURISTICS.coin.lose },
    ]);

    // 勝敗分類
    const resultResult = await classifyRoi(config.result.roi, resultClassifier, [
      { label: 'victory', ...COLOR_HEURISTICS.result.victory },
      { label: 'lose', ...COLOR_HEURISTICS.result.lose },
    ]);

    // スコアを計算
    const scores: DetectionScores = {
      coinWin: coinResult.label === 'win' ? coinResult.confidence : 0,
      coinLose: coinResult.label === 'lose' ? coinResult.confidence : 0,
      resultWin: resultResult.label === 'victory' ? resultResult.confidence : 0,
      resultLose: resultResult.label === 'lose' ? resultResult.confidence : 0,
      coinLabel: coinResult.label,
      resultLabel: resultResult.label,
      timestamp: message.timestamp,
    };

    // レスポンス送信
    const response: WorkerResponse = {
      type: 'scores',
      scores,
    };

    self.postMessage(response);

    // 定期ログ出力
    if (frameCount % 25 === 1) {
      log(
        'info',
        `Frame ${frameCount}: ${canvas.width}x${canvas.height}, FPS: ${currentFps}, ` +
          `fallback: ${usingFallback}, coin: ${coinResult.label}(${(coinResult.confidence * 100).toFixed(1)}%), ` +
          `result: ${resultResult.label}(${(resultResult.confidence * 100).toFixed(1)}%)`,
      );
    }
  } catch (error) {
    log('error', 'Failed to analyze frame:', error);

    // エラーレスポンス送信
    const response: WorkerResponse = {
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: message.timestamp,
    };
    self.postMessage(response);
  }
};

/**
 * FPS設定
 */
const handleSetFps = (message: { type: 'setFps'; fps: number }): void => {
  currentFps = message.fps;
  log('info', `FPS set to ${currentFps}`);
};

/**
 * リセット（状態はメインスレッドで管理するので何もしない）
 */
const handleReset = (): void => {
  log('info', 'Reset received (no-op for ML worker)');
};

/**
 * メッセージハンドラ
 */
self.onmessage = (event: MessageEvent<WorkerMessage>) => {
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

log('info', 'Screen analysis ML worker started');
