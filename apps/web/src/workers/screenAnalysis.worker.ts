import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  COIN_LOSS_COLOR,
  COIN_ROI,
  COIN_WIN_COLOR,
  RESULT_LOSS_COLOR,
  RESULT_ROI,
  RESULT_WIN_COLOR,
} from '../utils/screenAnalysis/config.js';
import type { AnalysisFrame, CoinResult, ColorTarget, DetectionResult, ROI, WorkerMessage } from '../utils/screenAnalysis/types.js';

function extractROI(imageData: ImageData, roi: ROI): Uint8ClampedArray {
  const x = Math.floor(roi.left * imageData.width);
  const y = Math.floor(roi.top * imageData.height);
  const w = Math.floor(roi.width * imageData.width);
  const h = Math.floor(roi.height * imageData.height);

  const pixels = new Uint8ClampedArray(w * h * 4);
  for (let row = 0; row < h; row++) {
    const srcOffset = ((y + row) * imageData.width + x) * 4;
    const dstOffset = row * w * 4;
    pixels.set(imageData.data.subarray(srcOffset, srcOffset + w * 4), dstOffset);
  }
  return pixels;
}

function colorDistance(r: number, g: number, b: number, target: ColorTarget): number {
  const dr = r - target.r;
  const dg = g - target.g;
  const db = b - target.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function computeColorScore(pixels: Uint8ClampedArray, target: ColorTarget): number {
  let matchCount = 0;
  const totalPixels = pixels.length / 4;

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i] ?? 0;
    const g = pixels[i + 1] ?? 0;
    const b = pixels[i + 2] ?? 0;
    const dist = colorDistance(r, g, b, target);
    if (dist <= target.tolerance) {
      matchCount++;
    }
  }

  return matchCount / totalPixels;
}

function detectCoin(imageData: ImageData): { result: CoinResult; confidence: number } {
  const pixels = extractROI(imageData, COIN_ROI);

  const winScore = computeColorScore(pixels, COIN_WIN_COLOR);
  const lossScore = computeColorScore(pixels, COIN_LOSS_COLOR);

  if (winScore > lossScore && winScore > 0.05) {
    return { result: 'won', confidence: winScore };
  }
  if (lossScore > winScore && lossScore > 0.05) {
    return { result: 'lost', confidence: lossScore };
  }
  return { result: null, confidence: 0 };
}

function detectResult(imageData: ImageData): { result: DetectionResult; confidence: number } {
  const pixels = extractROI(imageData, RESULT_ROI);

  const winScore = computeColorScore(pixels, RESULT_WIN_COLOR);
  const lossScore = computeColorScore(pixels, RESULT_LOSS_COLOR);

  if (winScore > lossScore && winScore > 0.03) {
    return { result: 'win', confidence: winScore };
  }
  if (lossScore > winScore && lossScore > 0.03) {
    return { result: 'loss', confidence: lossScore };
  }
  return { result: null, confidence: 0 };
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
    result: result.result,
    resultConfidence: result.confidence,
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
