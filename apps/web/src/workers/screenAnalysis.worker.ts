import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  COIN_BAR_DARK_MIN,
  COIN_BAR_ROI,
  COIN_BAR_TEXT_MIN,
  COIN_BUTTONS_ROI,
  COIN_BUTTON_DARK_MIN,
  COIN_BUTTON_YELLOW_MIN,
  RESULT_BRIGHT_MIN,
  RESULT_LOSE_WIDTH_MIN,
  RESULT_TEXT_ROI,
  RESULT_VICTORY_WIDTH_MIN,
} from '../utils/screenAnalysis/config.js';
import type {
  AnalysisFrame,
  CoinResult,
  DetectionResult,
  ROI,
  WorkerMessage,
} from '../utils/screenAnalysis/types.js';

type ROIImage = {
  pixels: Uint8ClampedArray;
  width: number;
  height: number;
};

function extractROI(imageData: ImageData, roi: ROI): ROIImage {
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
  return { pixels, width: w, height: h };
}

function getLuminance(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function isYellowish(r: number, g: number, b: number): boolean {
  return r > 180 && g > 150 && b < 90;
}

function computeRatios(pixels: Uint8ClampedArray): {
  darkRatio: number;
  brightRatio: number;
  yellowRatio: number;
} {
  let darkCount = 0;
  let brightCount = 0;
  let yellowCount = 0;
  const total = pixels.length / 4;

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i] ?? 0;
    const g = pixels[i + 1] ?? 0;
    const b = pixels[i + 2] ?? 0;
    const luminance = getLuminance(r, g, b);

    if (luminance < 55) darkCount++;
    if (luminance > 220) brightCount++;
    if (isYellowish(r, g, b)) yellowCount++;
  }

  return {
    darkRatio: darkCount / total,
    brightRatio: brightCount / total,
    yellowRatio: yellowCount / total,
  };
}

function computeHalfDarkRatios(roi: ROIImage): { leftDark: number; rightDark: number } {
  const { pixels, width, height } = roi;
  const halfWidth = Math.floor(width / 2);
  let leftDark = 0;
  let rightDark = 0;
  const leftTotal = halfWidth * height;
  const rightTotal = (width - halfWidth) * height;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = pixels[idx] ?? 0;
      const g = pixels[idx + 1] ?? 0;
      const b = pixels[idx + 2] ?? 0;
      const luminance = getLuminance(r, g, b);
      if (luminance < 55) {
        if (x < halfWidth) {
          leftDark++;
        } else {
          rightDark++;
        }
      }
    }
  }

  return {
    leftDark: leftDark / leftTotal,
    rightDark: rightDark / rightTotal,
  };
}

function detectCoin(imageData: ImageData): {
  result: CoinResult;
  confidence: number;
  debug: {
    barDarkRatio: number;
    barBrightRatio: number;
    buttonYellowRatio: number;
    buttonsLeftDarkRatio: number;
    buttonsRightDarkRatio: number;
    barPresent: boolean;
    hasTwoButtons: boolean;
  };
} {
  const bar = extractROI(imageData, COIN_BAR_ROI);
  const barRatios = computeRatios(bar.pixels);

  const barPresent =
    barRatios.darkRatio >= COIN_BAR_DARK_MIN && barRatios.brightRatio >= COIN_BAR_TEXT_MIN;

  const buttons = extractROI(imageData, COIN_BUTTONS_ROI);
  const buttonRatios = computeRatios(buttons.pixels);
  const halves = computeHalfDarkRatios(buttons);

  const hasTwoButtons =
    halves.leftDark >= COIN_BUTTON_DARK_MIN &&
    halves.rightDark >= COIN_BUTTON_DARK_MIN &&
    buttonRatios.yellowRatio >= COIN_BUTTON_YELLOW_MIN;

  const debug = {
    barDarkRatio: barRatios.darkRatio,
    barBrightRatio: barRatios.brightRatio,
    buttonYellowRatio: buttonRatios.yellowRatio,
    buttonsLeftDarkRatio: halves.leftDark,
    buttonsRightDarkRatio: halves.rightDark,
    barPresent,
    hasTwoButtons,
  };

  if (!barPresent) {
    return { result: null, confidence: 0, debug };
  }

  if (hasTwoButtons) {
    const confidence = Math.min(
      1,
      (halves.leftDark + halves.rightDark) / 2 + buttonRatios.yellowRatio,
    );
    return { result: 'won', confidence, debug };
  }

  const confidence = Math.min(1, barRatios.darkRatio + barRatios.brightRatio);
  return { result: 'lost', confidence, debug };
}

function detectResult(imageData: ImageData): {
  result: DetectionResult;
  confidence: number;
  debug: { brightRatio: number; widthRatio: number; minX: number; maxX: number };
} {
  const roi = extractROI(imageData, RESULT_TEXT_ROI);
  const { pixels, width, height } = roi;
  const total = pixels.length / 4;
  let brightCount = 0;
  let minX = width;
  let maxX = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = pixels[idx] ?? 0;
      const g = pixels[idx + 1] ?? 0;
      const b = pixels[idx + 2] ?? 0;
      const luminance = getLuminance(r, g, b);
      if (luminance > 220) {
        brightCount++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }
  }

  const brightRatio = brightCount / total;
  const widthRatio = maxX > minX ? (maxX - minX + 1) / width : 0;
  const debug = { brightRatio, widthRatio, minX, maxX };

  if (brightRatio < RESULT_BRIGHT_MIN || maxX <= minX) {
    return { result: null, confidence: 0, debug };
  }

  if (widthRatio >= RESULT_VICTORY_WIDTH_MIN) {
    return { result: 'win', confidence: Math.min(1, widthRatio + brightRatio), debug };
  }
  if (widthRatio >= RESULT_LOSE_WIDTH_MIN) {
    return { result: 'loss', confidence: Math.min(1, widthRatio + brightRatio), debug };
  }

  return { result: null, confidence: 0, debug };
}

function analyzeFrame(imageData: ImageData): AnalysisFrame {
  // Scale to normalized size if needed
  let normalizedData = imageData;
  const normalized = imageData.width !== CANVAS_WIDTH || imageData.height !== CANVAS_HEIGHT;
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
    debug: {
      canvasWidth: normalizedData.width,
      canvasHeight: normalizedData.height,
      normalized,
      coin: coin.debug,
      result: result.debug,
    },
  };
}

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const msg = event.data;

  if (msg.type === 'analyze') {
    const result = analyzeFrame(msg.imageData);
    self.postMessage({ type: 'result', data: result });
  }
};
