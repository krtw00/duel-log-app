/**
 * TensorFlow.js を使った画像分類ユーティリティ
 *
 * 画面キャプチャから特定の部位（コイントス結果、勝敗表示など）を
 * 機械学習モデルで判定するための機能を提供する
 */
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import { createLogger } from '@/utils/logger';
import type { RoiRatio } from '@/utils/screenAnalysis';
import { roiToRect, createCanvas } from '@/utils/screenAnalysis';

const logger = createLogger('TfjsImageClassification');

// 分類結果の型定義
export type CoinClassification = 'win' | 'lose' | 'none';
export type ResultClassification = 'victory' | 'lose' | 'none';

// モデル入力サイズ（MobileNet 標準）
export const MODEL_INPUT_SIZE = 224;

// 分類器の設定
export interface ClassifierConfig {
  modelUrl: string;
  inputSize: number;
  labels: string[];
  threshold: number;
}

// デフォルト設定（学習済みモデルのラベル順序に合わせる）
export const TFJS_CONFIG = {
  coin: {
    modelUrl: '/models/coin-classifier/model.json',
    inputSize: MODEL_INPUT_SIZE,
    labels: ['lose', 'none', 'win'], // アルファベット順（学習時の順序）
    threshold: 0.6,
    roi: {
      x: 0.28,
      y: 0.58,
      width: 0.44,
      height: 0.12,
    } as RoiRatio,
  },
  result: {
    modelUrl: '/models/result-classifier/model.json',
    inputSize: MODEL_INPUT_SIZE,
    labels: ['lose', 'none', 'victory'], // アルファベット順（学習時の順序）
    threshold: 0.6,
    roi: {
      x: 0.05,
      y: 0.2,
      width: 0.9,
      height: 0.4,
    } as RoiRatio,
  },
};

/**
 * TensorFlow.js のバックエンドを初期化
 */
export const initTfjs = async (): Promise<string> => {
  // WebGL バックエンドを優先的に使用
  await tf.setBackend('webgl');
  await tf.ready();
  const backend = tf.getBackend();
  logger.info(`TensorFlow.js initialized with backend: ${backend}`);
  return backend;
};

/**
 * 画像分類器クラス
 */
export class ImageClassifier {
  private model: tf.LayersModel | tf.GraphModel | null = null;
  private config: ClassifierConfig;
  private isLoading = false;

  constructor(config: ClassifierConfig) {
    this.config = config;
  }

  /**
   * モデルをロード
   */
  async load(): Promise<boolean> {
    if (this.model) return true;
    if (this.isLoading) return false;

    this.isLoading = true;
    try {
      logger.info(`Loading model from: ${this.config.modelUrl}`);
      // LayersModel または GraphModel としてロード
      try {
        this.model = await tf.loadLayersModel(this.config.modelUrl);
        logger.info('Model loaded as LayersModel');
      } catch (layersError) {
        logger.warn('Failed to load as LayersModel, trying GraphModel:', layersError);
        // GraphModel として試行
        this.model = await tf.loadGraphModel(this.config.modelUrl);
        logger.info('Model loaded as GraphModel');
      }
      logger.info('Model loaded successfully');
      return true;
    } catch (error) {
      logger.error('Failed to load model:', error);
      return false;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * モデルがロード済みかどうか
   */
  get isLoaded(): boolean {
    return this.model !== null;
  }

  /**
   * Canvas から切り出した画像を分類
   */
  async classify(
    imageSource: HTMLCanvasElement | OffscreenCanvas | ImageData,
  ): Promise<{ label: string; confidence: number } | null> {
    if (!this.model) {
      logger.warn('Model not loaded');
      return null;
    }

    return tf.tidy(() => {
      // 画像をテンソルに変換
      let tensor: tf.Tensor3D;
      if (imageSource instanceof ImageData) {
        tensor = tf.browser.fromPixels(imageSource);
      } else {
        tensor = tf.browser.fromPixels(imageSource as HTMLCanvasElement);
      }

      // リサイズと正規化
      const resized = tf.image.resizeBilinear(tensor, [
        this.config.inputSize,
        this.config.inputSize,
      ]);
      const normalized = resized.div(255.0);
      const batched = normalized.expandDims(0);

      // 推論
      const predictions = this.model!.predict(batched) as tf.Tensor;
      const probabilities = predictions.dataSync();

      // 最大確率のクラスを取得
      let maxIndex = 0;
      let maxProb = probabilities[0];
      for (let i = 1; i < probabilities.length; i++) {
        if (probabilities[i] > maxProb) {
          maxProb = probabilities[i];
          maxIndex = i;
        }
      }

      const label = this.config.labels[maxIndex] || 'unknown';
      const confidence = maxProb;

      logger.debug(`Classification: ${label} (${(confidence * 100).toFixed(1)}%)`);

      return { label, confidence };
    });
  }

  /**
   * リソースを解放
   */
  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
  }
}

/**
 * ROI を切り出してモデル入力サイズにリサイズした Canvas を作成
 */
export const extractRoiForClassification = (
  sourceCanvas: HTMLCanvasElement | OffscreenCanvas,
  roi: RoiRatio,
  targetSize: number = MODEL_INPUT_SIZE,
): HTMLCanvasElement | OffscreenCanvas => {
  const sourceWidth = sourceCanvas.width;
  const sourceHeight = sourceCanvas.height;

  // ROI の矩形を計算
  const rect = roiToRect(roi, sourceWidth, sourceHeight);

  // 切り出し用 Canvas
  const outputCanvas = createCanvas(targetSize, targetSize);
  const ctx = outputCanvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // ソースから ROI を切り出してリサイズ描画
  ctx.drawImage(
    sourceCanvas as HTMLCanvasElement,
    rect.x,
    rect.y,
    rect.width,
    rect.height,
    0,
    0,
    targetSize,
    targetSize,
  );

  return outputCanvas;
};

/**
 * Canvas から直接 ROI を抽出して ImageData として返す
 */
export const extractRoiImageData = (
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  roi: RoiRatio,
  canvasWidth: number,
  canvasHeight: number,
): ImageData => {
  const rect = roiToRect(roi, canvasWidth, canvasHeight);
  return ctx.getImageData(rect.x, rect.y, rect.width, rect.height);
};

/**
 * ImageData をモデル入力サイズにリサイズ
 */
export const resizeImageData = (
  imageData: ImageData,
  targetSize: number = MODEL_INPUT_SIZE,
): ImageData => {
  // 一時 Canvas に描画
  const tempCanvas = createCanvas(imageData.width, imageData.height);
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) {
    throw new Error('Failed to get temp canvas context');
  }
  tempCtx.putImageData(imageData, 0, 0);

  // リサイズ用 Canvas
  const outputCanvas = createCanvas(targetSize, targetSize);
  const outputCtx = outputCanvas.getContext('2d');
  if (!outputCtx) {
    throw new Error('Failed to get output canvas context');
  }

  outputCtx.drawImage(tempCanvas as HTMLCanvasElement, 0, 0, targetSize, targetSize);
  return outputCtx.getImageData(0, 0, targetSize, targetSize);
};

/**
 * 簡易的な色ヒストグラムベースの判定（モデルなしでのフォールバック）
 * 学習済みモデルがない場合のデモ用
 */
export const classifyByColorHistogram = (
  imageData: ImageData,
  config: { targetColors: { label: string; rgb: [number, number, number]; tolerance: number }[] },
): { label: string; confidence: number } => {
  const { data, width, height } = imageData;
  const totalPixels = width * height;

  // 各ターゲット色へのマッチ度を計算
  const scores: { label: string; score: number }[] = config.targetColors.map(
    ({ label, rgb, tolerance }) => {
      let matchCount = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const distance = Math.sqrt(
          Math.pow(r - rgb[0], 2) + Math.pow(g - rgb[1], 2) + Math.pow(b - rgb[2], 2),
        );
        if (distance <= tolerance) {
          matchCount++;
        }
      }
      return { label, score: matchCount / totalPixels };
    },
  );

  // 最高スコアのラベルを返す
  scores.sort((a, b) => b.score - a.score);
  const best = scores[0];

  return {
    label: best.score > 0.05 ? best.label : 'none',
    confidence: best.score,
  };
};

/**
 * デバッグ用：Canvas の内容をコンソールに出力
 */
export const debugCanvas = (canvas: HTMLCanvasElement | OffscreenCanvas, label: string): void => {
  if (canvas instanceof HTMLCanvasElement) {
    logger.debug(`${label}: ${canvas.width}x${canvas.height}`, canvas.toDataURL().slice(0, 100));
  } else {
    logger.debug(`${label}: ${canvas.width}x${canvas.height} (OffscreenCanvas)`);
  }
};

/**
 * TensorFlow.js のメモリ使用状況をログ出力
 */
export const logMemoryUsage = (): void => {
  const memInfo = tf.memory();
  logger.debug(`TF.js memory: ${memInfo.numTensors} tensors, ${memInfo.numBytes} bytes`);
};
