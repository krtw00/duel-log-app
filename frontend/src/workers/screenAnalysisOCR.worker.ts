/**
 * 画面解析ハイブリッド Worker
 *
 * コイン検出: Tesseract.jsによるOCR
 * 結果検出: HSV色検出（装飾的フォントのため）
 */

import Tesseract from 'tesseract.js';
import type {
  WorkerMessage,
  WorkerResponse,
  WorkerConfig,
  DetectionScores,
  RoiRatio,
} from '@/utils/screenAnalysis/types';

// ログ出力ヘルパー（consoleとpostMessage両方に出力）
const log = (level: 'info' | 'warn' | 'error' | 'debug', message: string, ...args: unknown[]) => {
  const timestamp = Date.now();
  const formattedMessage =
    args.length > 0 ? `${message} ${args.map((a) => JSON.stringify(a)).join(' ')}` : message;

  // consoleに出力
  const isoTimestamp = new Date(timestamp).toISOString();
  console[level](`[ScreenAnalysisHybridWorker ${isoTimestamp}]`, message, ...args);

  // メインスレッドに送信
  const response: WorkerResponse = {
    type: 'log',
    level,
    message: formattedMessage,
    timestamp,
  };
  self.postMessage(response);
};

// Canvas
let canvas: OffscreenCanvas | null = null;
let ctx: OffscreenCanvasRenderingContext2D | null = null;

// デバッグ画像送信フラグ
const debugImageEnabled = true; // 開発中は有効

/**
 * デバッグ画像を送信
 */
const sendDebugImage = async (
  imageType: 'full' | 'coinRoi' | 'leftCrownRoi' | 'rightCrownRoi',
  sourceCanvas: OffscreenCanvas,
  metadata?: {
    label?: string;
    confidence?: number;
    leftGold?: number;
    rightGold?: number;
  },
) => {
  if (!debugImageEnabled) return;

  try {
    // 画像サイズを縮小（最大幅400px）
    const maxWidth = 400;
    const scale = Math.min(1, maxWidth / sourceCanvas.width);
    const scaledWidth = Math.floor(sourceCanvas.width * scale);
    const scaledHeight = Math.floor(sourceCanvas.height * scale);

    const scaledCanvas = new OffscreenCanvas(scaledWidth, scaledHeight);
    const scaledCtx = scaledCanvas.getContext('2d');
    if (!scaledCtx) return;

    scaledCtx.drawImage(sourceCanvas, 0, 0, scaledWidth, scaledHeight);

    // JPEG形式でBlob化（品質50%）
    const blob = await scaledCanvas.convertToBlob({ type: 'image/jpeg', quality: 0.5 });
    const arrayBuffer = await blob.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const dataUrl = `data:image/jpeg;base64,${base64}`;

    const response: WorkerResponse = {
      type: 'debugImage',
      imageType,
      dataUrl,
      frameCount,
      timestamp: Date.now(),
      metadata,
    };
    self.postMessage(response);
  } catch (error) {
    log('warn', 'Failed to send debug image:', error);
  }
};

/**
 * ROI画像をキャプチャして送信
 */
const captureRoiImage = async (
  ctx: OffscreenCanvasRenderingContext2D,
  roi: { x: number; y: number; width: number; height: number },
  canvasWidth: number,
  canvasHeight: number,
  imageType: 'coinRoi' | 'leftCrownRoi' | 'rightCrownRoi',
  metadata?: { label?: string; confidence?: number; leftGold?: number; rightGold?: number },
) => {
  const x = Math.floor(roi.x * canvasWidth);
  const y = Math.floor(roi.y * canvasHeight);
  const w = Math.floor(roi.width * canvasWidth);
  const h = Math.floor(roi.height * canvasHeight);

  const roiCanvas = new OffscreenCanvas(w, h);
  const roiCtx = roiCanvas.getContext('2d');
  if (!roiCtx) return;

  const imageData = ctx.getImageData(x, y, w, h);
  roiCtx.putImageData(imageData, 0, 0);

  await sendDebugImage(imageType, roiCanvas, metadata);
};

// Tesseract Scheduler（コイン検出用）
let scheduler: Tesseract.Scheduler | null = null;

// 状態
let isInitialized = false;
let config: WorkerConfig | null = null;

// フレームカウンタ
let frameCount = 0;

// 検出キーワード（コイン用）
// 注意: OCRはスペースを含むテキストを返すことがあるため、空白除去して検索
// 重要: 「選択してください」だけだと、カード効果の選択画面も誤検出するため
//       「先攻」「後攻」を含むフレーズで検出する
const KEYWORDS = {
  coin: {
    // 勝ち: 自分が選択できる状態（「先攻・後攻を選択してください」）
    // 「先攻」と「選択」の両方を含む場合のみマッチ
    win: ['先攻・後攻を選択してください', '先攻後攻を選択', '後攻を選択してください'],
    // 負け: 相手が選択中（「対戦相手が先攻・後攻を選択しています」）
    lose: ['選択しています'],
  },
};

// OKボタン検出用の設定（結果画面判定）
// OKボタンは暗いチャコールグレー/濃紺色
const OK_BUTTON_CONFIG = {
  // OKボタンのROI（画面下部中央）
  roi: {
    x: 0.40,
    y: 0.87,
    width: 0.20,
    height: 0.07,
  },
  // 暗い色検出モード（OKボタンは黒/濃紺）
  // V（明度）が低い色を検出
  valueMax: 0.25, // 明度25%以下（暗い色）
  // 検出に必要な最小ピクセル比率
  // 形状検出を追加したため閾値を緩和（12%→4%）
  // 実際のVICTORY画面では暗色比率が約5-25%
  minPixelRatio: 0.04, // 4%以上で結果画面と判定
  // 暗色比率の上限
  // ローディング/トランジション画面では暗色比率が80%などと異常に高くなる
  // 結果画面ではOKボタン部分のみが暗く、周囲は明るいため50%以下
  // 誤検出防止: 暗い画面全体を結果画面と誤認しないようにする
  maxPixelRatio: 0.50, // 50%以下で結果画面と判定
  // 旧設定（参考用）
  hueMin: 160,
  hueMax: 230,
  saturationMin: 0.1,
  valueMin: 0.05,
};

// 王冠アイコン検出用の設定
// VICTORY: 王冠が左端（自分側）、LOSE: 王冠が右端（相手側）
const CROWN_CONFIG = {
  // 金色/オレンジの王冠 - Hue: 15-55°
  hueMin: 15,
  hueMax: 55,
  // 彩度40%に設定（黄金背景でも王冠を検出するため緩めに）
  // エッジ検出で背景と王冠を区別する
  saturationMin: 0.40, // 彩度40%以上
  valueMin: 0.5, // 明度50%以上
  // 左右の比率の閾値（黄金背景対応で緩めに）
  leftRightRatioThreshold: 1.5,
  // 王冠のROI（画面端のエリア）
  // 王冠位置: x=7-15%, y=74-83% (VICTORY画像から計測)
  leftRoi: { x: 0.05, y: 0.72, width: 0.12, height: 0.13 },   // 左側 5-17%
  rightRoi: { x: 0.83, y: 0.72, width: 0.12, height: 0.13 }, // 右側 83-95%
};

/**
 * ROI矩形を計算
 */
const roiToRect = (
  roi: RoiRatio,
  width: number,
  height: number,
): { x: number; y: number; width: number; height: number } => {
  return {
    x: Math.floor(roi.x * width),
    y: Math.floor(roi.y * height),
    width: Math.floor(roi.width * width),
    height: Math.floor(roi.height * height),
  };
};

/**
 * 画像前処理（OCR精度向上）
 */
const preprocessImage = (imageData: ImageData): ImageData => {
  const data = new Uint8ClampedArray(imageData.data);

  for (let i = 0; i < data.length; i += 4) {
    // グレースケール変換
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;

    // コントラスト強調
    const contrast = 1.5;
    const threshold = 128;
    const adjusted = (gray - threshold) * contrast + threshold;
    const clamped = Math.max(0, Math.min(255, adjusted));

    data[i] = clamped;
    data[i + 1] = clamped;
    data[i + 2] = clamped;
  }

  return new ImageData(data, imageData.width, imageData.height);
};

/**
 * RGB → HSV 変換
 * @returns { h: 0-360, s: 0-1, v: 0-1 }
 */
const rgbToHsv = (r: number, g: number, b: number): { h: number; s: number; v: number } => {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === rNorm) {
      h = 60 * (((gNorm - bNorm) / delta) % 6);
    } else if (max === gNorm) {
      h = 60 * ((bNorm - rNorm) / delta + 2);
    } else {
      h = 60 * ((rNorm - gNorm) / delta + 4);
    }
  }
  if (h < 0) h += 360;

  const s = max === 0 ? 0 : delta / max;
  const v = max;

  return { h, s, v };
};

/**
 * OKボタン検出（結果画面判定）
 * 画面下部中央の青いOKボタンを検出
 */
const detectOkButton = (
  ctx: OffscreenCanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
): { isResultScreen: boolean; darkPixels: number; ratio: number } => {
  const roi = OK_BUTTON_CONFIG.roi;
  const x = Math.floor(roi.x * canvasWidth);
  const y = Math.floor(roi.y * canvasHeight);
  const w = Math.floor(roi.width * canvasWidth);
  const h = Math.floor(roi.height * canvasHeight);

  const imageData = ctx.getImageData(x, y, w, h);
  const { data } = imageData;
  const totalPixels = w * h;

  let darkPixels = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const hsv = rgbToHsv(r, g, b);

    // 暗い色ピクセルのチェック（OKボタンは黒/濃紺）
    if (hsv.v <= OK_BUTTON_CONFIG.valueMax) {
      darkPixels++;
    }
  }

  const ratio = darkPixels / totalPixels;
  // 暗色比率が下限以上かつ上限以下の場合のみ結果画面と判定
  // 下限: OKボタンが存在する（4%以上）
  // 上限: 画面全体が暗くない（50%以下）- ローディング/トランジション画面を除外
  const isResultScreen =
    ratio >= OK_BUTTON_CONFIG.minPixelRatio && ratio <= OK_BUTTON_CONFIG.maxPixelRatio;

  // デバッグ: 画面下半分をグリッド分割して色分布を調査（500フレームごと）
  if (frameCount % 500 === 0) {
    const startY = Math.floor(canvasHeight / 2); // 下半分のみ
    const fullImageData = ctx.getImageData(0, startY, canvasWidth, canvasHeight - startY);
    const fullData = fullImageData.data;
    const scanHeight = canvasHeight - startY;
    const gridSize = 5; // 5x5グリッド
    const blueGridCounts: number[][] = Array.from({ length: gridSize }, () =>
      Array(gridSize).fill(0),
    );
    const darkGridCounts: number[][] = Array.from({ length: gridSize }, () =>
      Array(gridSize).fill(0),
    );
    const gridTotals: number[][] = Array.from({ length: gridSize }, () =>
      Array(gridSize).fill(0),
    );
    const cellW = Math.floor(canvasWidth / gridSize);
    const cellH = Math.floor(scanHeight / gridSize);

    for (let py = 0; py < scanHeight; py++) {
      for (let px = 0; px < canvasWidth; px++) {
        const idx = (py * canvasWidth + px) * 4;
        const r = fullData[idx];
        const g = fullData[idx + 1];
        const b = fullData[idx + 2];
        const hsv = rgbToHsv(r, g, b);

        const gridX = Math.min(Math.floor(px / cellW), gridSize - 1);
        const gridY = Math.min(Math.floor(py / cellH), gridSize - 1);
        gridTotals[gridY][gridX]++;

        // 青色検出
        if (
          hsv.h >= OK_BUTTON_CONFIG.hueMin &&
          hsv.h <= OK_BUTTON_CONFIG.hueMax &&
          hsv.s >= OK_BUTTON_CONFIG.saturationMin &&
          hsv.v >= OK_BUTTON_CONFIG.valueMin
        ) {
          blueGridCounts[gridY][gridX]++;
        }
        // 暗い色（黒/濃紺）検出: V < 0.2
        if (hsv.v < 0.2) {
          darkGridCounts[gridY][gridX]++;
        }
      }
    }

    log('info', `=== 画面下半分の色分布（5x5グリッド）===`);
    log('info', `Canvas: ${canvasWidth}x${canvasHeight}, 下半分: ${scanHeight}px, 各セル: ${cellW}x${cellH}`);
    log('info', `【青色 H${OK_BUTTON_CONFIG.hueMin}-${OK_BUTTON_CONFIG.hueMax}】`);
    for (let gy = 0; gy < gridSize; gy++) {
      const row = blueGridCounts[gy]
        .map((count, gx) => {
          const pct = ((count / gridTotals[gy][gx]) * 100).toFixed(1);
          return `${pct}%`.padStart(6);
        })
        .join(' ');
      log('info', `行${gy}: ${row}`);
    }
    log('info', `【暗色 V<20%】`);
    for (let gy = 0; gy < gridSize; gy++) {
      const row = darkGridCounts[gy]
        .map((count, gx) => {
          const pct = ((count / gridTotals[gy][gx]) * 100).toFixed(1);
          return `${pct}%`.padStart(6);
        })
        .join(' ');
      log('info', `行${gy}: ${row}`);
    }
    log(
      'info',
      `現在のROI: x=${(roi.x * 100).toFixed(0)}%-${((roi.x + roi.width) * 100).toFixed(0)}%, y=${(roi.y * 100).toFixed(0)}%-${((roi.y + roi.height) * 100).toFixed(0)}%`,
    );
  }

  // デバッグ: ROI内のピクセル色をサンプリング（200フレームごと）
  if (frameCount % 200 === 0) {
    // ROI中央付近の色をサンプリング
    const samples: string[] = [];
    const centerX = Math.floor(w / 2);
    const centerY = Math.floor(h / 2);
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const px = centerX + dx * 10;
        const py = centerY + dy * 10;
        if (px >= 0 && px < w && py >= 0 && py < h) {
          const idx = (py * w + px) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const hsv = rgbToHsv(r, g, b);
          samples.push(`H${Math.round(hsv.h)}S${Math.round(hsv.s * 100)}V${Math.round(hsv.v * 100)}`);
        }
      }
    }
    log(
      'debug',
      `OKボタンROI色サンプル (${x},${y},${w}x${h}): ${samples.join(' ')}`,
    );
    log(
      'debug',
      `期待値: V<=${Math.round(OK_BUTTON_CONFIG.valueMax * 100)}%（暗い色）`,
    );
  }

  // デバッグ: 暗色ピクセルが少しでも検出されたらログ出力
  if (darkPixels > 0 || frameCount % 100 === 0) {
    log(
      'debug',
      `OKボタン検出: ROI(${x},${y},${w}x${h}) 暗色=${darkPixels}/${totalPixels} (${(ratio * 100).toFixed(1)}%) 閾値=${OK_BUTTON_CONFIG.minPixelRatio * 100}%-${OK_BUTTON_CONFIG.maxPixelRatio * 100}%`,
    );
  }

  // デバッグ: 暗色比率が上限を超えた場合は警告ログ
  // ローディング/トランジション画面の可能性を示唆
  if (ratio > OK_BUTTON_CONFIG.maxPixelRatio) {
    log(
      'debug',
      `OKボタン除外: 暗色比率が上限超過 (${(ratio * 100).toFixed(1)}% > ${OK_BUTTON_CONFIG.maxPixelRatio * 100}%) - ローディング/トランジション画面の可能性`,
    );
  }

  return { isResultScreen, darkPixels, ratio };
};

/**
 * ImageData内の金色ピクセル数をカウント
 */
const countGoldPixelsInImageData = (imageData: ImageData): number => {
  const { data } = imageData;
  let goldPixels = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const hsv = rgbToHsv(r, g, b);

    if (
      hsv.h >= CROWN_CONFIG.hueMin &&
      hsv.h <= CROWN_CONFIG.hueMax &&
      hsv.s >= CROWN_CONFIG.saturationMin &&
      hsv.v >= CROWN_CONFIG.valueMin
    ) {
      goldPixels++;
    }
  }

  return goldPixels;
};

/**
 * 金色ピクセルの2値マスクを生成
 * @returns 0または255の1次元配列（width * height）
 */
const createGoldMask = (imageData: ImageData): Uint8Array => {
  const { data, width, height } = imageData;
  const mask = new Uint8Array(width * height);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const hsv = rgbToHsv(r, g, b);

    const pixelIndex = i / 4;
    if (
      hsv.h >= CROWN_CONFIG.hueMin &&
      hsv.h <= CROWN_CONFIG.hueMax &&
      hsv.s >= CROWN_CONFIG.saturationMin &&
      hsv.v >= CROWN_CONFIG.valueMin
    ) {
      mask[pixelIndex] = 255;
    }
  }

  return mask;
};

// ========== 王冠検出設定 ==========

// 王冠検出の設定（集中度ベース）
const CROWN_DETECTION_CONFIG = {
  // 集中度閾値（金色ピクセルが集中しているか）
  concentrationThreshold: 0.4,
  // 集中度検出用の最低金色ピクセル数（低め）
  minGoldPixels: 500,
  // 「勝った側」の最低金色ピクセル数
  // 実際の結果画面では勝者の王冠に大量の金色がある
  // 1280幅に縮小後の想定値: 元65841 → 約16000-30000（解像度による）
  // 誤検出防止: 金色が少ない画面（L=560等）を除外
  // 縮小後でも動作するよう閾値を調整
  minWinnerGoldPixels: 5000,
  // 「負けた側」の最小金色ピクセル数
  // 結果画面のアニメーション途中では敗者側の金色が少ない
  // 例: アニメーション途中の誤検出 R=1503（少なすぎ）
  // 例: 安定後の正常検出 R=9754, L=1561（両方1000以上）
  // アニメーション途中を除外し、画面が安定してから検出する
  minLoserGoldPixels: 1000,
  // 「負けた側」の最大金色ピクセル数
  // 結果画面では負けた側（王冠がない側）は背景のみで金色が少ない
  // カード情報ポップアップ等では両側に大量の金色があるため、これで除外
  // 正しいVICTORY例: L=65841, R=18429 → R=18429を許容する必要あり
  // 誤検出例: L=22127, R=79419 → L=22127を拒否する必要あり
  maxLoserGoldPixels: 20000,
};


/**
 * 金色ピクセルの集中度を計算
 *
 * 王冠: 特定領域に集中
 * 建物: 分散している
 *
 * @returns 0-1の集中度スコア（1に近いほど集中）
 */
const calculateGoldConcentration = (
  mask: Uint8Array,
  width: number,
  height: number,
): { score: number; centerX: number; centerY: number; boundingBox: { w: number; h: number } } => {
  // 金色ピクセルの重心を計算
  let sumX = 0;
  let sumY = 0;
  let count = 0;
  let minX = width;
  let maxX = 0;
  let minY = height;
  let maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (mask[y * width + x] > 0) {
        sumX += x;
        sumY += y;
        count++;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (count === 0) {
    return { score: 0, centerX: 0, centerY: 0, boundingBox: { w: 0, h: 0 } };
  }

  const centerX = sumX / count;
  const centerY = sumY / count;
  const boundingW = maxX - minX + 1;
  const boundingH = maxY - minY + 1;

  // バウンディングボックス内の充填率（王冠は40-80%程度）
  const boundingArea = boundingW * boundingH;
  const fillRatio = count / boundingArea;

  // バウンディングボックスのアスペクト比（王冠は横長〜正方形）
  const aspectRatio = boundingW / (boundingH || 1);
  const aspectScore = aspectRatio >= 0.5 && aspectRatio <= 2.0 ? 1 : 0.5;

  // 重心からの分散（低いほど集中）
  let variance = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (mask[y * width + x] > 0) {
        const dx = x - centerX;
        const dy = y - centerY;
        variance += dx * dx + dy * dy;
      }
    }
  }
  const stdDev = Math.sqrt(variance / count);

  // 理想的な分散（バウンディングボックスの対角線の1/4程度）
  const idealStd = Math.sqrt(boundingW * boundingW + boundingH * boundingH) / 4;
  const dispersionScore = Math.max(0, 1 - stdDev / (idealStd * 2));

  // 総合スコア
  // 充填率 40-80% で最大、アスペクト比、分散度を考慮
  const fillScore = fillRatio >= 0.3 && fillRatio <= 0.9 ? 1 : 0.5;
  const score = (fillScore * 0.4 + aspectScore * 0.3 + dispersionScore * 0.3);

  return {
    score,
    centerX,
    centerY,
    boundingBox: { w: boundingW, h: boundingH },
  };
};

/**
 * 金色ピクセルの集中度で王冠を検出
 *
 * 1. 金色ピクセル数チェック
 * 2. 集中度分析（建物のような分散パターンを除外）
 */
const detectCrownByConcentration = (
  imageData: ImageData,
): { detected: boolean; score: number; concentration: number } => {
  const { width, height } = imageData;

  // 1. 金色マスク生成
  const goldMask = createGoldMask(imageData);

  // 金色ピクセル数チェック
  let goldCount = 0;
  for (let i = 0; i < goldMask.length; i++) {
    if (goldMask[i] > 0) goldCount++;
  }

  // 最低限の金色ピクセルが必要
  if (goldCount < CROWN_DETECTION_CONFIG.minGoldPixels) {
    return { detected: false, score: 0, concentration: 0 };
  }

  // 2. 集中度分析
  const concentration = calculateGoldConcentration(goldMask, width, height);

  // 集中度が閾値以上なら王冠検出
  const detected = concentration.score >= CROWN_DETECTION_CONFIG.concentrationThreshold;

  return {
    detected,
    score: concentration.score,
    concentration: concentration.score,
  };
};

/**
 * 王冠位置検出によるVICTORY/LOSE判定
 * 左端と右端のROIのみを検査（フィールドの色を誤検出しない）
 * ctxから直接ROIを取得してメモリ使用量を抑える
 *
 * 検出条件（集中度ベース）:
 * 1. 金色ピクセルの集中度が高い（建物のような分散パターンを除外）
 * 2. 左右の金色ピクセル比率が閾値以上
 */
const detectCrownPosition = (
  ctx: OffscreenCanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
): {
  label: string;
  confidence: number;
  stats: {
    leftGold: number;
    rightGold: number;
    leftConcentration?: number;
    rightConcentration?: number;
  };
} => {
  // 左端ROIを取得
  const leftRoi = CROWN_CONFIG.leftRoi;
  const leftX = Math.floor(leftRoi.x * canvasWidth);
  const leftY = Math.floor(leftRoi.y * canvasHeight);
  const leftW = Math.floor(leftRoi.width * canvasWidth);
  const leftH = Math.floor(leftRoi.height * canvasHeight);
  const leftImageData = ctx.getImageData(leftX, leftY, leftW, leftH);
  const leftGoldPixels = countGoldPixelsInImageData(leftImageData);

  // 右端ROIを取得
  const rightRoi = CROWN_CONFIG.rightRoi;
  const rightX = Math.floor(rightRoi.x * canvasWidth);
  const rightY = Math.floor(rightRoi.y * canvasHeight);
  const rightW = Math.floor(rightRoi.width * canvasWidth);
  const rightH = Math.floor(rightRoi.height * canvasHeight);
  const rightImageData = ctx.getImageData(rightX, rightY, rightW, rightH);
  const rightGoldPixels = countGoldPixelsInImageData(rightImageData);

  // 左右の比率を計算
  const leftRatio = leftGoldPixels / (rightGoldPixels || 1);
  const rightRatio = rightGoldPixels / (leftGoldPixels || 1);

  // 集中度検出結果
  let leftResult = { detected: false, score: 0, concentration: 0 };
  let rightResult = { detected: false, score: 0, concentration: 0 };

  // 左側の集中度検出（金ピクセルが最低数以上あれば実行）
  if (leftGoldPixels >= CROWN_DETECTION_CONFIG.minGoldPixels) {
    leftResult = detectCrownByConcentration(leftImageData);
    log(
      'debug',
      `Left crown: detected=${leftResult.detected}, conc=${leftResult.concentration.toFixed(2)}`,
    );
  }

  // 右側の集中度検出（金ピクセルが最低数以上あれば実行）
  if (rightGoldPixels >= CROWN_DETECTION_CONFIG.minGoldPixels) {
    rightResult = detectCrownByConcentration(rightImageData);
    log(
      'debug',
      `Right crown: detected=${rightResult.detected}, conc=${rightResult.concentration.toFixed(2)}`,
    );
  }

  const stats = {
    leftGold: leftGoldPixels,
    rightGold: rightGoldPixels,
    leftConcentration: leftResult.concentration,
    rightConcentration: rightResult.concentration,
  };

  // VICTORY: 左に王冠（集中度検出成功 + 比率 + 勝者側の金ピクセルが十分 + 敗者側の金ピクセルが適正範囲）
  // 右側（負けた側）の金ピクセルが多すぎる場合はカード情報ポップアップ等と判断
  // 右側（負けた側）の金ピクセルが少なすぎる場合はアニメーション途中と判断
  // 左側（勝った側）の金ピクセルが少なすぎる場合は結果画面ではないと判断
  if (
    leftResult.detected &&
    leftRatio >= CROWN_CONFIG.leftRightRatioThreshold &&
    leftGoldPixels >= CROWN_DETECTION_CONFIG.minWinnerGoldPixels &&
    rightGoldPixels >= CROWN_DETECTION_CONFIG.minLoserGoldPixels &&
    rightGoldPixels <= CROWN_DETECTION_CONFIG.maxLoserGoldPixels
  ) {
    // 集中度を信頼度に反映
    const confidence = Math.min(0.95, 0.6 + leftResult.concentration * 0.3);
    return { label: 'victory', confidence, stats };
  }

  // LOSE: 右に王冠（集中度検出成功 + 比率 + 勝者側の金ピクセルが十分 + 敗者側の金ピクセルが適正範囲）
  // 左側（負けた側）の金ピクセルが多すぎる場合はカード情報ポップアップ等と判断
  // 左側（負けた側）の金ピクセルが少なすぎる場合はアニメーション途中と判断
  // 右側（勝った側）の金ピクセルが少なすぎる場合は結果画面ではないと判断
  if (
    rightResult.detected &&
    rightRatio >= CROWN_CONFIG.leftRightRatioThreshold &&
    rightGoldPixels >= CROWN_DETECTION_CONFIG.minWinnerGoldPixels &&
    leftGoldPixels >= CROWN_DETECTION_CONFIG.minLoserGoldPixels &&
    leftGoldPixels <= CROWN_DETECTION_CONFIG.maxLoserGoldPixels
  ) {
    const confidence = Math.min(0.95, 0.6 + rightResult.concentration * 0.3);
    return { label: 'lose', confidence, stats };
  }

  // 両側に金色が多い場合はデバッグログを出力
  if (
    leftGoldPixels > CROWN_DETECTION_CONFIG.maxLoserGoldPixels &&
    rightGoldPixels > CROWN_DETECTION_CONFIG.maxLoserGoldPixels
  ) {
    log(
      'debug',
      `王冠検出スキップ: 両側に金色が多すぎ (L=${leftGoldPixels}, R=${rightGoldPixels}, max=${CROWN_DETECTION_CONFIG.maxLoserGoldPixels}) - カード情報ポップアップの可能性`,
    );
  }

  // 勝者側の金色が少なすぎる場合はデバッグログを出力
  // どちらかの集中度検出が成功しているが、金ピクセルが閾値未満の場合
  if (
    (leftResult.detected && leftGoldPixels < CROWN_DETECTION_CONFIG.minWinnerGoldPixels) ||
    (rightResult.detected && rightGoldPixels < CROWN_DETECTION_CONFIG.minWinnerGoldPixels)
  ) {
    const winnerSide = leftResult.detected ? 'L' : 'R';
    const winnerPixels = leftResult.detected ? leftGoldPixels : rightGoldPixels;
    log(
      'debug',
      `王冠検出スキップ: 勝者側の金色が不足 (${winnerSide}=${winnerPixels}, min=${CROWN_DETECTION_CONFIG.minWinnerGoldPixels}) - 結果画面ではない可能性`,
    );
  }

  // 敗者側の金色が少なすぎる場合（アニメーション途中）はデバッグログを出力
  // 勝者側は条件を満たしているが、敗者側がまだ表示されていない
  if (
    (leftResult.detected &&
      leftGoldPixels >= CROWN_DETECTION_CONFIG.minWinnerGoldPixels &&
      rightGoldPixels < CROWN_DETECTION_CONFIG.minLoserGoldPixels) ||
    (rightResult.detected &&
      rightGoldPixels >= CROWN_DETECTION_CONFIG.minWinnerGoldPixels &&
      leftGoldPixels < CROWN_DETECTION_CONFIG.minLoserGoldPixels)
  ) {
    const loserSide = leftResult.detected ? 'R' : 'L';
    const loserPixels = leftResult.detected ? rightGoldPixels : leftGoldPixels;
    log(
      'debug',
      `王冠検出スキップ: 敗者側の金色が不足 (${loserSide}=${loserPixels}, min=${CROWN_DETECTION_CONFIG.minLoserGoldPixels}) - アニメーション途中の可能性`,
    );
  }

  return { label: 'none', confidence: 0, stats };
};

/**
 * 初期化処理
 */
const handleInit = async (message: { type: 'init'; config: WorkerConfig }): Promise<void> => {
  try {
    log('info', 'Initializing hybrid worker (OCR + Template matching)...');
    config = message.config;

    // Tesseract Schedulerを作成（コイン検出用）
    scheduler = Tesseract.createScheduler();

    // 日本語Worker（コイントス用のみ）
    const workerJpn = await Tesseract.createWorker('jpn', 1, {
      logger: (m) => {
        if (m.status === 'loading tesseract core' || m.status === 'loading language traineddata') {
          log('info', `OCR JPN: ${m.status}`);
        }
      },
    });
    scheduler.addWorker(workerJpn);

    isInitialized = true;
    log('info', 'Hybrid worker initialized (OCR for coin, concentration-based detection for result)');

    const response: WorkerResponse = {
      type: 'init',
      success: true,
      modelStatus: {
        tfjsReady: true, // 互換性のため
        coinModelLoaded: true,
        resultModelLoaded: true,
        usingFallback: false,
      },
    };

    self.postMessage(response);
  } catch (error) {
    log('error', 'Failed to initialize OCR worker:', error);
    const response: WorkerResponse = {
      type: 'init',
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initialize OCR',
    };
    self.postMessage(response);
  }
};

/**
 * コイントス検出（OCR）
 */
const detectCoin = async (
  imageData: ImageData,
): Promise<{ label: string; confidence: number }> => {
  if (!scheduler) {
    return { label: 'none', confidence: 0 };
  }

  try {
    // 前処理
    const processed = preprocessImage(imageData);

    // 一時Canvasに描画
    const tempCanvas = new OffscreenCanvas(processed.width, processed.height);
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) {
      return { label: 'none', confidence: 0 };
    }
    tempCtx.putImageData(processed, 0, 0);

    // Blobに変換
    const blob = await tempCanvas.convertToBlob({ type: 'image/png' });

    // OCR実行
    const result = await scheduler.addJob('recognize', blob);
    const text = result.data.text;
    const confidence = result.data.confidence / 100;

    // 認識されたテキストをログ（最初の100文字）
    const cleanText = text.replace(/\s+/g, ' ').trim();
    // 空白を除去したテキスト（キーワード検索用）
    const noSpaceText = text.replace(/\s+/g, '');

    if (cleanText.length > 0) {
      log('info', `Coin OCR text: "${cleanText.slice(0, 100)}" conf=${(confidence * 100).toFixed(0)}%`);
    }

    // 負けキーワードを先にチェック（より具体的）
    // 空白除去テキストで検索（OCRが「選択 し て いま す」のように分割することがあるため）
    for (const keyword of KEYWORDS.coin.lose) {
      if (noSpaceText.includes(keyword)) {
        log('info', `Coin lose detected: keyword="${keyword}"`);
        return { label: 'lose', confidence: Math.max(confidence, 0.8) };
      }
    }

    // 勝ちキーワードをチェック
    for (const keyword of KEYWORDS.coin.win) {
      if (noSpaceText.includes(keyword)) {
        log('info', `Coin win detected: keyword="${keyword}"`);
        return { label: 'win', confidence: Math.max(confidence, 0.8) };
      }
    }

    return { label: 'none', confidence };
  } catch (error) {
    log('error', 'Coin OCR failed:', error);
    return { label: 'none', confidence: 0 };
  }
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

  if (!isInitialized || !config) {
    const response: WorkerResponse = {
      type: 'error',
      error: 'Worker not initialized',
      timestamp: message.timestamp,
    };
    self.postMessage(response);
    return;
  }

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

    // ========== 2条件検出 ==========
    // 結果画面判定: OKボタン（暗色）AND 王冠（金色）の両方が必要

    // Step 1: OKボタン検出（暗色）
    const okButtonResult = detectOkButton(ctx!, canvas.width, canvas.height);

    // Step 2: 王冠検出（常に実行）
    // 王冠検出はctxから直接ROIを取得（メモリ効率化）
    const crownResult = detectCrownPosition(ctx!, canvas.width, canvas.height);

    // Step 3: 両方の条件を満たす場合のみ結果画面と判定
    // 王冠検出: L/R各15%x20%=3%の領域
    // 誤検出防止: 王冠側に5000px以上の金色が必要（detectCrownPosition内でチェック）
    const totalGoldPixels = crownResult.stats.leftGold + crownResult.stats.rightGold;
    const hasCrown = crownResult.label !== 'none'; // labelがnone以外なら王冠検出成功

    // デバッグ: 王冠検出の詳細（100フレームごと、または検出時）
    if (frameCount % 100 === 0 || totalGoldPixels > 100) {
      const concInfo = crownResult.stats.leftConcentration !== undefined || crownResult.stats.rightConcentration !== undefined
        ? `, conc: L=${crownResult.stats.leftConcentration?.toFixed(2) ?? '-'}/R=${crownResult.stats.rightConcentration?.toFixed(2) ?? '-'}`
        : '';
      log(
        'debug',
        `王冠検出: L=${crownResult.stats.leftGold}, R=${crownResult.stats.rightGold}, ` +
          `total=${totalGoldPixels}, label=${crownResult.label}${concInfo}`,
      );
    }
    const isResultScreen = okButtonResult.isResultScreen && hasCrown;

    let resultResult: { label: string; confidence: number; stats: { leftGold: number; rightGold: number } };
    if (isResultScreen) {
      resultResult = crownResult;
    } else {
      resultResult = { label: 'none', confidence: 0, stats: { leftGold: 0, rightGold: 0 } };
    }

    // Coin ROI抽出（OCR）
    const coinRect = roiToRect(config.coin.roi, canvas.width, canvas.height);
    const coinImageData = ctx!.getImageData(
      coinRect.x,
      coinRect.y,
      coinRect.width,
      coinRect.height,
    );

    // コイン検出（OCR）
    const coinResult = await detectCoin(coinImageData);

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

    // 定期ログ出力（検出時は毎回、それ以外は10フレームごと）
    const hasDetection = coinResult.label !== 'none' || resultResult.label !== 'none';
    if (hasDetection || frameCount % 10 === 1) {
      // 検出状況を表示
      const totalGold = crownResult.stats.leftGold + crownResult.stats.rightGold;
      const okStatus = okButtonResult.isResultScreen ? '✓' : '×';
      const crownStatus = hasCrown ? '✓' : '×';
      const screenInfo = ` [暗色:${okStatus}${(okButtonResult.ratio * 100).toFixed(0)}% 王冠:${crownStatus}${totalGold}px${isResultScreen ? ' →結果画面' : ''}]`;
      const crownDetail =
        isResultScreen
          ? ` [L=${crownResult.stats.leftGold}(conc:${crownResult.stats.leftConcentration?.toFixed(2) ?? '-'}), R=${crownResult.stats.rightGold}(conc:${crownResult.stats.rightConcentration?.toFixed(2) ?? '-'})]`
          : '';
      log(
        hasDetection ? 'info' : 'debug',
        `Frame ${frameCount}: ` +
          `coin: ${coinResult.label}(${(coinResult.confidence * 100).toFixed(0)}%), ` +
          `result: ${resultResult.label}(${(resultResult.confidence * 100).toFixed(0)}%)${screenInfo}${crownDetail}`,
      );
    }

    // ========== デバッグ画像キャプチャ ==========
    if (debugImageEnabled && ctx && canvas) {
      // 1. 定期的にフル画像をキャプチャ（60フレームごと = 約7.5秒）
      //    ROI範囲を青/赤/緑の枠で描画して、判定位置を視覚的に確認可能
      if (frameCount % 60 === 1) {
        // ROIオーバーレイはメモリ使用量が多いため、通常のフル画像を送信
        await sendDebugImage('full', canvas, {
          label: `frame_${frameCount}`,
        });
      }

      // 2. コイン検出時にコインROI画像をキャプチャ
      if (coinResult.label !== 'none') {
        await captureRoiImage(
          ctx,
          config.coin.roi,
          canvas.width,
          canvas.height,
          'coinRoi',
          {
            label: coinResult.label,
            confidence: coinResult.confidence,
          },
        );
      }

      // 3. 結果画面検出時に王冠ROI画像をキャプチャ
      if (isResultScreen) {
        // 左ROI
        await captureRoiImage(
          ctx,
          CROWN_CONFIG.leftRoi,
          canvas.width,
          canvas.height,
          'leftCrownRoi',
          {
            label: crownResult.label,
            confidence: crownResult.confidence,
            leftGold: crownResult.stats.leftGold,
            rightGold: crownResult.stats.rightGold,
          },
        );
        // 右ROI
        await captureRoiImage(
          ctx,
          CROWN_CONFIG.rightRoi,
          canvas.width,
          canvas.height,
          'rightCrownRoi',
          {
            label: crownResult.label,
            confidence: crownResult.confidence,
            leftGold: crownResult.stats.leftGold,
            rightGold: crownResult.stats.rightGold,
          },
        );
      }

      // 4. 金色ピクセルが多い場合もキャプチャ（誤検出調査用、30フレームごと）
      if (totalGoldPixels > 1000 && frameCount % 30 === 0) {
        await captureRoiImage(
          ctx,
          CROWN_CONFIG.leftRoi,
          canvas.width,
          canvas.height,
          'leftCrownRoi',
          {
            label: `gold_check_${crownResult.label}`,
            leftGold: crownResult.stats.leftGold,
            rightGold: crownResult.stats.rightGold,
          },
        );
        await captureRoiImage(
          ctx,
          CROWN_CONFIG.rightRoi,
          canvas.width,
          canvas.height,
          'rightCrownRoi',
          {
            label: `gold_check_${crownResult.label}`,
            leftGold: crownResult.stats.leftGold,
            rightGold: crownResult.stats.rightGold,
          },
        );
      }
    }
  } catch (error) {
    log('error', 'Failed to analyze frame:', error);

    const response: WorkerResponse = {
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: message.timestamp,
    };
    self.postMessage(response);
  }
};

/**
 * リセット
 */
const handleReset = (): void => {
  log('info', 'Reset received');
  frameCount = 0;
};

/**
 * メッセージハンドラ
 */
self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;

  // null/undefinedチェック
  if (!message || typeof message !== 'object' || !message.type) {
    log('warn', 'Invalid message received:', message);
    return;
  }

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
      // OCRでは特に処理不要
      break;
    default:
      log('warn', 'Unknown message type:', message);
  }
};

log('info', 'Screen analysis hybrid worker started (OCR + Crown detection)');
