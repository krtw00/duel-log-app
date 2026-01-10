import { createLogger } from '@/utils/logger';

const logger = createLogger('ScreenAnalysis');

export type AnalysisResult = 'win' | 'lose';

export interface RoiRatio {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type CoinResult = 'win' | 'lose';
export type TemplateSet = Record<string, TemplateData>;

export interface ScreenAnalysisConfig {
  normalizedWidth: number;
  scanFps: number;
  turnChoice: {
    winTemplateUrl: string;
    loseTemplateUrl: string;
    templateBaseWidth: number;
    supportedHeights: number[];
    roi: RoiRatio;
    threshold: number;
    margin: number;
    requiredStreak: number;
    cooldownMs: number;
    activeMs: number;
    downscale: number;
    stride: number;
    useEdge: boolean;
    blurSigma: number;
  };
  okButton: {
    templateUrl: string;
    templateBaseWidth: number;
    supportedHeights: number[];
    roi: RoiRatio;
    threshold: number;
    requiredStreak: number;
    cooldownMs: number;
    activeMs: number;
    downscale: number;
    stride: number;
    useEdge: boolean;
    blurSigma: number;
  };
  result: {
    winTemplateUrl: string;
    loseTemplateUrl: string;
    templateBaseWidth: number;
    supportedHeights: number[];
    roi: RoiRatio;
    threshold: number;
    margin: number;
    requiredStreak: number;
    cooldownMs: number;
    downscale: number;
    stride: number;
    useEdge: boolean;
    blurSigma: number;
  };
}

const resolvePublicUrl = (path: string) => {
  const base = typeof import.meta !== 'undefined' ? import.meta.env.BASE_URL || '/' : '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  return `${normalizedBase}${normalizedPath}`;
};

export const SCREEN_ANALYSIS_CONFIG: ScreenAnalysisConfig = {
  normalizedWidth: 1280,
  scanFps: 10,
  turnChoice: {
    winTemplateUrl: resolvePublicUrl('screen-analysis/coin-win.png'),
    loseTemplateUrl: resolvePublicUrl('screen-analysis/coin-lose.png'),
    templateBaseWidth: 3200,
    supportedHeights: [720, 768, 810, 900, 1080, 1152, 1440, 1800, 2160],
    roi: {
      x: 0.28,
      y: 0.58,
      width: 0.44,
      height: 0.12,
    },
    threshold: 0.45,
    margin: 0.1,
    requiredStreak: 2,
    cooldownMs: 15000,
    activeMs: 20000,
    downscale: 1.0,
    stride: 1,
    useEdge: false,
    blurSigma: 1.0,
  },
  okButton: {
    templateUrl: resolvePublicUrl('screen-analysis/ok-button.png'),
    templateBaseWidth: 3200,
    supportedHeights: [720, 768, 810, 900, 1080, 1152, 1440, 1800, 2160],
    roi: {
      x: 0.3,
      y: 0.85,
      width: 0.4,
      height: 0.1,
    },
    threshold: 0.45,
    requiredStreak: 1,
    cooldownMs: 8000,
    activeMs: 8000,
    downscale: 1.0,
    stride: 1,
    useEdge: false,
    blurSigma: 1.0,
  },
  result: {
    winTemplateUrl: resolvePublicUrl('screen-analysis/result-win.png'),
    loseTemplateUrl: resolvePublicUrl('screen-analysis/result-lose.png'),
    templateBaseWidth: 3200,
    supportedHeights: [720, 768, 810, 900, 1080, 1152, 1440, 1800, 2160],
    roi: {
      x: 0.05,
      y: 0.2,
      width: 0.9,
      height: 0.4,
    },
    threshold: 0.35,
    margin: 0.1,
    requiredStreak: 2,
    cooldownMs: 12000,
    downscale: 1.0,
    stride: 1,
    useEdge: true,
    blurSigma: 1.0,
  },
};

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GrayscaleImage {
  width: number;
  height: number;
  data: Float32Array;
}

export interface TemplateData extends GrayscaleImage {
  mean: number;
  std: number;
  mask: Float32Array | null;
  maskSum: number;
}

export const createCanvas = (width: number, height: number) => {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height);
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

export const roiToRect = (roi: RoiRatio, width: number, height: number): Rect => {
  const rect = {
    x: Math.round(roi.x * width),
    y: Math.round(roi.y * height),
    width: Math.round(roi.width * width),
    height: Math.round(roi.height * height),
  };

  const maxWidth = Math.max(1, width);
  const maxHeight = Math.max(1, height);
  const clamped = {
    x: Math.min(Math.max(0, rect.x), maxWidth - 1),
    y: Math.min(Math.max(0, rect.y), maxHeight - 1),
    width: Math.max(1, Math.min(rect.width, maxWidth - rect.x)),
    height: Math.max(1, Math.min(rect.height, maxHeight - rect.y)),
  };

  return clamped;
};

const ALPHA_MASK_THRESHOLD = 0.05;

export const toGrayscale = (imageData: ImageData): GrayscaleImage => {
  const { data, width, height } = imageData;
  const gray = new Float32Array(width * height);
  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    gray[p] = 0.299 * r + 0.587 * g + 0.114 * b;
  }
  return { width, height, data: gray };
};

export const toGrayscaleWithMask = (
  imageData: ImageData,
): GrayscaleImage & { mask: Float32Array; maskSum: number } => {
  const { data, width, height } = imageData;
  const gray = new Float32Array(width * height);
  const mask = new Float32Array(width * height);
  let maskSum = 0;
  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3] / 255;
    const weight = a >= ALPHA_MASK_THRESHOLD ? a : 0;
    gray[p] = 0.299 * r + 0.587 * g + 0.114 * b;
    mask[p] = weight;
    maskSum += weight;
  }
  return { width, height, data: gray, mask, maskSum };
};

export const downscale = (
  image: GrayscaleImage & { mask?: Float32Array },
  scale: number,
): GrayscaleImage & { mask?: Float32Array } => {
  if (scale >= 0.99) return image;
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const data = new Float32Array(width * height);
  const mask = image.mask ? new Float32Array(width * height) : undefined;
  const scaleX = image.width / width;
  const scaleY = image.height / height;

  for (let y = 0; y < height; y += 1) {
    const srcY = Math.min(image.height - 1, Math.floor(y * scaleY));
    for (let x = 0; x < width; x += 1) {
      const srcX = Math.min(image.width - 1, Math.floor(x * scaleX));
      const srcIndex = srcY * image.width + srcX;
      const destIndex = y * width + x;
      data[destIndex] = image.data[srcIndex];
      if (mask) {
        mask[destIndex] = image.mask ? image.mask[srcIndex] : 1;
      }
    }
  }

  return { width, height, data, mask };
};

export const applyGaussianBlur = (
  image: GrayscaleImage & { mask?: Float32Array },
  sigma: number = 1.0,
): GrayscaleImage & { mask?: Float32Array } => {
  if (sigma <= 0) return image;

  const { width, height, data } = image;
  const output = new Float32Array(width * height);

  // カーネルサイズを決定（sigma * 3で十分）
  const kernelRadius = Math.ceil(sigma * 3);
  const kernelSize = kernelRadius * 2 + 1;

  // 1Dガウシアンカーネルを生成
  const kernel = new Float32Array(kernelSize);
  let kernelSum = 0;
  for (let i = 0; i < kernelSize; i++) {
    const x = i - kernelRadius;
    kernel[i] = Math.exp(-(x * x) / (2 * sigma * sigma));
    kernelSum += kernel[i];
  }
  // 正規化
  for (let i = 0; i < kernelSize; i++) {
    kernel[i] /= kernelSum;
  }

  // 水平方向のブラー
  const temp = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let weightSum = 0;
      for (let k = -kernelRadius; k <= kernelRadius; k++) {
        const sx = Math.min(Math.max(0, x + k), width - 1);
        const weight = kernel[k + kernelRadius];
        sum += data[y * width + sx] * weight;
        weightSum += weight;
      }
      temp[y * width + x] = sum / weightSum;
    }
  }

  // 垂直方向のブラー
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let weightSum = 0;
      for (let k = -kernelRadius; k <= kernelRadius; k++) {
        const sy = Math.min(Math.max(0, y + k), height - 1);
        const weight = kernel[k + kernelRadius];
        sum += temp[sy * width + x] * weight;
        weightSum += weight;
      }
      output[y * width + x] = sum / weightSum;
    }
  }

  return { width, height, data: output, mask: image.mask };
};

export const applySobel = (
  image: GrayscaleImage & { mask?: Float32Array },
): GrayscaleImage & { mask?: Float32Array } => {
  const { width, height, data } = image;
  const output = new Float32Array(width * height);

  const idx = (x: number, y: number) => y * width + x;

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const gx =
        -1 * data[idx(x - 1, y - 1)] +
        1 * data[idx(x + 1, y - 1)] +
        -2 * data[idx(x - 1, y)] +
        2 * data[idx(x + 1, y)] +
        -1 * data[idx(x - 1, y + 1)] +
        1 * data[idx(x + 1, y + 1)];
      const gy =
        -1 * data[idx(x - 1, y - 1)] +
        -2 * data[idx(x, y - 1)] +
        -1 * data[idx(x + 1, y - 1)] +
        1 * data[idx(x - 1, y + 1)] +
        2 * data[idx(x, y + 1)] +
        1 * data[idx(x + 1, y + 1)];
      output[idx(x, y)] = Math.sqrt(gx * gx + gy * gy);
    }
  }

  return { width, height, data: output, mask: image.mask };
};

export const computeTemplateStats = (data: Float32Array, mask?: Float32Array) => {
  let sum = 0;
  let sumSq = 0;
  let weightSum = 0;
  if (mask) {
    for (let i = 0; i < data.length; i += 1) {
      const weight = mask[i];
      if (weight <= 0) continue;
      const value = data[i];
      sum += weight * value;
      sumSq += weight * value * value;
      weightSum += weight;
    }
  } else {
    for (let i = 0; i < data.length; i += 1) {
      const value = data[i];
      sum += value;
      sumSq += value * value;
    }
    weightSum = data.length;
  }
  if (weightSum <= 0) {
    return { mean: 0, std: 0, weightSum: 0 };
  }
  const mean = sum / weightSum;
  const variance = Math.max(0, sumSq / weightSum - mean * mean);
  const std = Math.sqrt(variance);
  return { mean, std, weightSum };
};

export const prepareTemplate = (
  imageData: ImageData,
  options: { downscale: number; useEdge: boolean; blurSigma?: number },
): TemplateData => {
  const withMask = toGrayscaleWithMask(imageData);
  let grayscale: GrayscaleImage & { mask?: Float32Array } = downscale(withMask, options.downscale);
  if (options.blurSigma && options.blurSigma > 0) {
    grayscale = applyGaussianBlur(grayscale, options.blurSigma);
  }
  if (options.useEdge) {
    grayscale = applySobel(grayscale);
  }
  const { mean, std, weightSum } = computeTemplateStats(grayscale.data, grayscale.mask);
  return {
    width: grayscale.width,
    height: grayscale.height,
    data: grayscale.data,
    mean,
    std,
    mask: grayscale.mask ?? null,
    maskSum: weightSum,
  };
};

/**
 * 解像度に応じたsigmaを計算する
 * 低解像度ほどsigmaを大きくして、縮小によるノイズを軽減
 * @param baseSigma 基準sigma（1800p時の値）
 * @param currentHeight 現在の解像度の高さ
 * @param baseHeight 基準解像度の高さ（デフォルト1800）
 */
export const calculateScaledSigma = (
  baseSigma: number,
  currentHeight: number,
  baseHeight: number = 1800,
): number => {
  if (baseSigma <= 0) return 0;
  // 低解像度ほどsigmaを大きく（baseHeight/currentHeight比で増加）
  const scale = baseHeight / currentHeight;
  return baseSigma * Math.max(1, scale);
};

export const loadTemplateSetFromUrl = async (
  url: string,
  options: {
    downscale: number;
    useEdge: boolean;
    blurSigma?: number;
    templateBaseWidth: number;
    supportedHeights: number[];
  },
): Promise<TemplateSet> => {
  if (typeof window === 'undefined') {
    throw new Error('Window is not available');
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch master template (${response.status}): ${url}`);
  }
  const blob = await response.blob();
  let source: ImageBitmap | HTMLImageElement | null = null;
  let objectUrl: string | null = null;

  try {
    // 1. マスター画像を一度だけデコード
    if ('createImageBitmap' in window) {
      source = await createImageBitmap(blob);
    } else {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      objectUrl = URL.createObjectURL(blob);
      const loadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error(`Failed to load master template: ${url}`));
      });
      image.src = objectUrl;
      source = await loadPromise;
    }

    if (!source) {
      throw new Error(`Master template decode failed: ${url}`);
    }

    const templateSet: TemplateSet = {};
    const masterWidth = source.width;
    const masterHeight = source.height;

    // 2. サポートする解像度ごとにテンプレートを生成
    for (const height of options.supportedHeights) {
      const scale = (height * (16 / 9)) / options.templateBaseWidth;
      const targetWidth = Math.max(1, Math.round(masterWidth * scale));
      const targetHeight = Math.max(1, Math.round(masterHeight * scale));

      const canvas = createCanvas(targetWidth, targetHeight);
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        logger.error(`Failed to create canvas context for size ${targetWidth}x${targetHeight}`);
        continue;
      }
      ctx.drawImage(source, 0, 0, targetWidth, targetHeight);
      const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);

      // 3. 各解像度で前処理を実行（解像度に応じてsigmaをスケーリング）
      const scaledSigma = options.blurSigma
        ? calculateScaledSigma(options.blurSigma, height)
        : undefined;
      const templateData = prepareTemplate(imageData, {
        ...options,
        blurSigma: scaledSigma,
      });
      templateSet[height.toString()] = templateData;
    }

    return templateSet;
  } finally {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
    if (source && 'close' in source) {
      source.close();
    }
  }
};

export const loadTemplateFromUrl = async (
  url: string,
  options: {
    downscale: number;
    useEdge: boolean;
    templateBaseWidth?: number;
    normalizedWidth?: number;
  },
): Promise<TemplateData> => {
  if (typeof window === 'undefined') {
    throw new Error('Window is not available');
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch template (${response.status}): ${url}`);
  }
  const blob = await response.blob();
  let source: ImageBitmap | HTMLImageElement | null = null;
  let objectUrl: string | null = null;

  try {
    if ('createImageBitmap' in window) {
      source = await createImageBitmap(blob);
    } else {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      objectUrl = URL.createObjectURL(blob);
      const loadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error(`Failed to load template: ${url}`));
      });
      image.src = objectUrl;
      source = await loadPromise;
    }

    if (!source) {
      throw new Error(`Template decode failed: ${url}`);
    }

    let targetWidth = source.width;
    let targetHeight = source.height;
    if (options.templateBaseWidth && options.normalizedWidth) {
      const scale = options.normalizedWidth / options.templateBaseWidth;
      if (scale > 0 && Math.abs(scale - 1) > 0.01) {
        targetWidth = Math.max(1, Math.round(source.width * scale));
        targetHeight = Math.max(1, Math.round(source.height * scale));
      }
    }

    const canvas = createCanvas(targetWidth, targetHeight);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      throw new Error(`Failed to create canvas context: ${url}`);
    }
    ctx.drawImage(source, 0, 0, targetWidth, targetHeight);
    const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
    return prepareTemplate(imageData, options);
  } finally {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
    if (source && 'close' in source) {
      source.close();
    }
  }
};

export const matchTemplateNcc = (
  source: GrayscaleImage,
  template: TemplateData,
  stride: number,
): number => {
  if (template.std === 0 || template.maskSum <= 0) return 0;
  const maxX = source.width - template.width;
  const maxY = source.height - template.height;
  if (maxX < 0 || maxY < 0) return 0;

  const n = template.maskSum;
  let best = -1;

  for (let y = 0; y <= maxY; y += stride) {
    for (let x = 0; x <= maxX; x += stride) {
      let sum = 0;
      let sumSq = 0;
      let sumCross = 0;

      for (let ty = 0; ty < template.height; ty += 1) {
        const srcRow = (y + ty) * source.width + x;
        const tmplRow = ty * template.width;
        for (let tx = 0; tx < template.width; tx += 1) {
          const tmplIndex = tmplRow + tx;
          const weight = template.mask ? template.mask[tmplIndex] : 1;
          if (weight <= 0) continue;
          const srcVal = source.data[srcRow + tx];
          const tmplVal = template.data[tmplIndex];
          sum += weight * srcVal;
          sumSq += weight * srcVal * srcVal;
          sumCross += weight * srcVal * tmplVal;
        }
      }

      const mean = sum / n;
      const variance = sumSq / n - mean * mean;
      if (variance <= 0) continue;
      const std = Math.sqrt(variance);
      const score = (sumCross - n * mean * template.mean) / (n * std * template.std);
      if (score > best) best = score;
    }
  }

  return best;
};

export const extractAndPreprocess = (
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  rect: Rect,
  options: { downscale: number; useEdge: boolean; blurSigma?: number },
): GrayscaleImage => {
  const imageData = ctx.getImageData(rect.x, rect.y, rect.width, rect.height);
  let grayscale: GrayscaleImage = toGrayscale(imageData);
  grayscale = downscale(grayscale, options.downscale);
  if (options.blurSigma && options.blurSigma > 0) {
    grayscale = applyGaussianBlur(grayscale, options.blurSigma);
  }
  if (options.useEdge) {
    grayscale = applySobel(grayscale);
  }
  return grayscale;
};
