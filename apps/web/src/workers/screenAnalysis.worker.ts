import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  COIN_ROI,
  COIN_MATCH_THRESHOLD,
  HASH_MARGIN,
  RESULT_ROI,
  RESULT_MATCH_THRESHOLD,
} from '../utils/screenAnalysis/config.js';
import type {
  AnalysisFrame,
  CoinResult,
  DetectionResult,
  ROI,
  WorkerMessage,
} from '../utils/screenAnalysis/types.js';
import {
  COIN_HASH_HEIGHT,
  COIN_HASH_WIDTH,
  COIN_LOSE_HASH,
  COIN_WIN_HASH,
  RESULT_HASH_HEIGHT,
  RESULT_HASH_WIDTH,
  RESULT_LOSE_HASH,
  RESULT_WIN_HASH,
} from '../utils/screenAnalysis/templates.js';

function luminanceAt(data: Uint8ClampedArray, width: number, x: number, y: number): number {
  const idx = (y * width + x) * 4;
  const r = data[idx] ?? 0;
  const g = data[idx + 1] ?? 0;
  const b = data[idx + 2] ?? 0;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function computeDHash(
  imageData: ImageData,
  roi: ROI,
  hashWidth: number,
  hashHeight: number,
): Uint8Array {
  const { width, height, data } = imageData;
  const x0 = Math.floor(roi.left * width);
  const y0 = Math.floor(roi.top * height);
  const roiW = Math.max(1, Math.floor(roi.width * width));
  const roiH = Math.max(1, Math.floor(roi.height * height));
  const stepX = roiW / hashWidth;
  const stepY = roiH / hashHeight;

  const bits = new Uint8Array(hashWidth * hashHeight);
  let idx = 0;
  for (let y = 0; y < hashHeight; y += 1) {
    const sampleY = clamp(Math.floor(y0 + (y + 0.5) * stepY), 0, height - 1);
    let prevLum = luminanceAt(data, width, clamp(Math.floor(x0 + 0.5 * stepX), 0, width - 1), sampleY);
    for (let x = 0; x < hashWidth; x += 1) {
      const sampleX = clamp(Math.floor(x0 + (x + 1.5) * stepX), 0, width - 1);
      const nextLum = luminanceAt(data, width, sampleX, sampleY);
      bits[idx] = prevLum > nextLum ? 1 : 0;
      idx += 1;
      prevLum = nextLum;
    }
  }
  return bits;
}

function hashSimilarity(a: Uint8Array, b: Uint8Array): number {
  const len = Math.min(a.length, b.length);
  let same = 0;
  for (let i = 0; i < len; i += 1) {
    if (a[i] === b[i]) same += 1;
  }
  return same / len;
}

function detectCoin(imageData: ImageData): {
  result: CoinResult;
  confidence: number;
  winScore: number;
  lossScore: number;
} {
  const hash = computeDHash(imageData, COIN_ROI, COIN_HASH_WIDTH, COIN_HASH_HEIGHT);
  const winScore = hashSimilarity(hash, COIN_WIN_HASH);
  const lossScore = hashSimilarity(hash, COIN_LOSE_HASH);
  const confidence = Math.max(winScore, lossScore);

  if (winScore >= COIN_MATCH_THRESHOLD && winScore - lossScore >= HASH_MARGIN) {
    return { result: 'won', confidence, winScore, lossScore };
  }
  if (lossScore >= COIN_MATCH_THRESHOLD && lossScore - winScore >= HASH_MARGIN) {
    return { result: 'lost', confidence, winScore, lossScore };
  }
  return { result: null, confidence, winScore, lossScore };
}

function detectResult(imageData: ImageData): {
  result: DetectionResult;
  confidence: number;
  winScore: number;
  lossScore: number;
} {
  const hash = computeDHash(imageData, RESULT_ROI, RESULT_HASH_WIDTH, RESULT_HASH_HEIGHT);
  const winScore = hashSimilarity(hash, RESULT_WIN_HASH);
  const lossScore = hashSimilarity(hash, RESULT_LOSE_HASH);
  const confidence = Math.max(winScore, lossScore);

  if (winScore >= RESULT_MATCH_THRESHOLD && winScore - lossScore >= HASH_MARGIN) {
    return { result: 'win', confidence, winScore, lossScore };
  }
  if (lossScore >= RESULT_MATCH_THRESHOLD && lossScore - winScore >= HASH_MARGIN) {
    return { result: 'loss', confidence, winScore, lossScore };
  }
  return { result: null, confidence, winScore, lossScore };
}

function analyzeFrame(imageData: ImageData): AnalysisFrame {
  // Scale to normalized size if needed
  let normalizedData = imageData;
  if (imageData.width !== CANVAS_WIDTH || imageData.height !== CANVAS_HEIGHT) {
    // Create offscreen canvas for resizing
    const canvas = new OffscreenCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const tempCanvas = new OffscreenCanvas(imageData.width, imageData.height);
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.putImageData(imageData, 0, 0);
        ctx.drawImage(tempCanvas, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        normalizedData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }
    }
  }

  const coin = detectCoin(normalizedData);
  const result = detectResult(normalizedData);

  return {
    coin: coin.result,
    coinConfidence: coin.confidence,
    coinWinScore: coin.winScore,
    coinLossScore: coin.lossScore,
    result: result.result,
    resultConfidence: result.confidence,
    resultWinScore: result.winScore,
    resultLossScore: result.lossScore,
    timestamp: Date.now(),
  };
}

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const msg = event.data;

  if (msg.type === 'analyze') {
    const result = analyzeFrame(msg.imageData);
    self.postMessage({ type: 'result', data: result });
  }
};
