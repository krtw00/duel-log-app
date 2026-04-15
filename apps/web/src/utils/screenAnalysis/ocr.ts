import type { TesseractWorker } from 'tesseract.js';
import { COIN_OCR_ROIS, RESULT_MESSAGE_OCR_ROIS } from './config.js';
import type { CoinResult, DetectionResult, FSMState } from './types.js';

export type CoinOcrSnapshot = {
  text: string;
  result: CoinResult | null;
  confidence: number;
  detectedIsFirst: boolean | null;
  detectionResult: DetectionResult;
  detectionConfidence: number;
  detectionText: string;
  updatedAt: number;
  expiresAt: number;
};

export type SelectionPromptState = 'selfSelect' | 'opponentSelect';

export type CoinOcrDiagnostics = {
  lastSkipReason: string | null;
  lastAttemptAt: number | null;
  lastCompletedAt: number | null;
  lastError: string | null;
  lastRawText: string | null;
  lastParsedResult: CoinResult | null;
  lastParsedConfidence: number | null;
  lastParsedIsFirst: boolean | null;
  lastParsedDetectionResult: DetectionResult;
  lastParsedDetectionConfidence: number | null;
  rawPreviewDataUrl: string | null;
  processedPreviewDataUrl: string | null;
  roi:
    | {
        label: string;
        x: number;
        y: number;
        width: number;
        height: number;
        targetWidth: number;
        targetHeight: number;
      }
    | null;
};

const COIN_OCR_INTERVAL_MS = 200;
const COIN_OCR_TTL_MS = 4000;
const TURN_ORDER_OCR_TTL_MS = 2500;
const COIN_OCR_SCALE = 1.25;
const COIN_OCR_LUMINANCE_THRESHOLD = 160;
const COIN_OCR_IDLE_RESULT_TTL_MS = 0;
const PROMPT_FRAME_SAMPLE_RATIO = 0.18;
const PROMPT_FRAME_CYAN_RATIO = 0.01;

function createInitialDiagnostics(): CoinOcrDiagnostics {
  return {
    lastSkipReason: null,
    lastAttemptAt: null,
    lastCompletedAt: null,
    lastError: null,
    lastRawText: null,
    lastParsedResult: null,
    lastParsedConfidence: null,
    lastParsedIsFirst: null,
    lastParsedDetectionResult: null,
    lastParsedDetectionConfidence: null,
    rawPreviewDataUrl: null,
    processedPreviewDataUrl: null,
    roi: null,
  };
}

function stringifyError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function hasPromptFrame(rawImageData: ImageData): boolean {
  const { data, width, height } = rawImageData;
  const bandHeight = Math.max(1, Math.floor(height * PROMPT_FRAME_SAMPLE_RATIO));

  let cyanCount = 0;
  let sampleCount = 0;

  const isCyan = (r: number, g: number, b: number) =>
    r <= 100 && g >= 110 && b >= 140 && b - r >= 60;

  for (let y = 0; y < height; y += 1) {
    if (y >= bandHeight && y < height - bandHeight) continue;

    for (let x = 0; x < width; x += 1) {
      const idx = (y * width + x) * 4;
      const r = data[idx] ?? 0;
      const g = data[idx + 1] ?? 0;
      const b = data[idx + 2] ?? 0;

      sampleCount += 1;
      if (isCyan(r, g, b)) cyanCount += 1;
    }
  }

  return sampleCount > 0 && cyanCount / sampleCount >= PROMPT_FRAME_CYAN_RATIO;
}

export function parseSelectionPromptText(
  text: string,
): { state: SelectionPromptState; confidence: number } | null {
  const cleaned = text.replace(/\s+/g, '').replace(/[|\uff5c]/g, '');
  const hasTurnWords = /\u5148\u653b|\u5148\u884c|\u5f8c\u653b/.test(cleaned);
  const hasSelectionWords = /\u9078\u629e/.test(cleaned);
  const hasOpponentRef = /\u5bfe\u6226\u76f8\u624b|\u76f8\u624b/.test(cleaned);
  const hasSelfRef = /\u3042\u306a\u305f\u304c|\u3042\u306a\u305f\u306f/.test(cleaned);
  const hasPleaseTail =
    /\u304f.{0,3}\u3060.{0,3}\u3055.{0,3}\u3044/.test(cleaned) ||
    /\u9078\u629e\u3057.{0,3}\u3066.{0,3}\u304f.{0,3}\u3060/.test(cleaned);
  const hasInProgressTail =
    /\u9078\u629e\u3057.{0,3}\u3066.{0,3}[\u3044\u304d].{0,3}[\u307e]?.{0,2}\u3059/.test(cleaned) ||
    /\u3057.{0,3}\u3066.{0,3}[\u3044\u304d].{0,3}[\u307e]?.{0,2}\u3059/.test(cleaned);
  const isOpponentSelecting =
    hasTurnWords &&
    hasSelectionWords &&
    !hasPleaseTail &&
    (hasOpponentRef || hasInProgressTail);
  const isSelfSelecting =
    hasTurnWords &&
    hasSelectionWords &&
    hasPleaseTail &&
    !hasSelfRef &&
    !hasInProgressTail;

  if (isOpponentSelecting) return { state: 'opponentSelect', confidence: 0.92 };
  if (isSelfSelecting) return { state: 'selfSelect', confidence: 0.92 };
  return null;
}

export function parseCoinText(text: string): { result: CoinResult; confidence: number } | null {
  const parsed = parseSelectionPromptText(text);
  if (parsed) {
    return {
      result: parsed.state === 'selfSelect' ? 'won' : 'lost',
      confidence: parsed.confidence,
    };
  }

  const turnOrder = parseTurnOrderText(text);
  if (turnOrder) {
    return {
      result: turnOrder.isFirst ? 'won' : 'lost',
      confidence: turnOrder.confidence,
    };
  }

  return null;
}

export function parseTurnOrderText(
  text: string,
): { isFirst: boolean; confidence: number } | null {
  const cleaned = text.replace(/\s+/g, '').replace(/[|\uff5c]/g, '');
  const hasSelfRef = /\u3042\u306a\u305f|\u306a\u305f/.test(cleaned);
  const hasOpponentRef = /\u5bfe\u6226\u76f8\u624b/.test(cleaned);
  const hasSelectionRef = /\u9078\u629e/.test(cleaned);
  const hasSettledTurnOrder = /\u5148\u653b\u3067\u3059|\u5148\u884c\u3067\u3059|\u5f8c\u653b\u3067\u3059/.test(
    cleaned,
  );

  const isSelfFirst =
    !hasOpponentRef &&
    !hasSelectionRef &&
    (hasSelfRef || hasSettledTurnOrder) &&
    /\u5148\u653b|\u5148\u884c/.test(cleaned);
  const isSelfSecond =
    !hasOpponentRef &&
    !hasSelectionRef &&
    (hasSelfRef || hasSettledTurnOrder) &&
    /\u5f8c\u653b/.test(cleaned);

  if (isSelfFirst) return { isFirst: true, confidence: 0.96 };
  if (isSelfSecond) return { isFirst: false, confidence: 0.96 };
  return null;
}

export function parseResultMessageText(
  text: string,
): { result: DetectionResult; confidence: number } | null {
  const cleaned = text.replace(/\s+/g, '').replace(/[|\uff5c]/g, '');
  const hasSurrender = /\u964d\u53c2/.test(cleaned);
  const hasOpponent = /\u5bfe\u6226\u76f8\u624b|\u76f8\u624b/.test(cleaned);
  const hasVictory = /\u52dd\u5229/.test(cleaned);
  const hasDefeat = /\u6557\u5317/.test(cleaned);

  if (hasSurrender && hasOpponent) {
    return { result: 'win', confidence: 0.94 };
  }
  if (hasSurrender && !hasOpponent) {
    return { result: 'loss', confidence: 0.94 };
  }
  if (hasVictory) {
    return { result: 'win', confidence: 0.9 };
  }
  if (hasDefeat) {
    return { result: 'loss', confidence: 0.9 };
  }
  return null;
}

type CapturedImage = {
  dataUrl: string;
  roi: {
    label: string;
    x: number;
    y: number;
    width: number;
    height: number;
    targetWidth: number;
    targetHeight: number;
  };
  rawPreviewDataUrl: string;
  processedPreviewDataUrl: string;
};

type OcrAttempt = CapturedImage & {
  text: string;
  parsed: { result: CoinResult; confidence: number } | null;
  turnOrder: { isFirst: boolean; confidence: number } | null;
  detection: { result: DetectionResult; confidence: number } | null;
};

export class CoinOcrManager {
  snapshot: CoinOcrSnapshot | null = null;

  private worker: TesseractWorker | null = null;
  private workerPromise: Promise<TesseractWorker> | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private running = false;
  private lastOcrAt = 0;
  private diagnostics: CoinOcrDiagnostics = createInitialDiagnostics();

  getDiagnostics(): CoinOcrDiagnostics {
    return { ...this.diagnostics, roi: this.diagnostics.roi ? { ...this.diagnostics.roi } : null };
  }

  private async ensureWorker(): Promise<TesseractWorker> {
    if (this.worker) return this.worker;
    if (this.workerPromise) return this.workerPromise;

    this.workerPromise = (async () => {
      const module = await import('tesseract.js');
      const worker = await module.createWorker('jpn');
      await worker.setParameters({
        tessedit_pageseg_mode: '7',
      });
      this.worker = worker;
      return worker;
    })().catch((error) => {
      this.workerPromise = null;
      throw error;
    });

    return this.workerPromise;
  }

  private captureImage(
    source: CanvasImageSource,
    sourceWidth: number,
    sourceHeight: number,
    roiConfig: (typeof COIN_OCR_ROIS)[number],
  ): CapturedImage | null {
    const width = sourceWidth;
    const height = sourceHeight;
    if (!width || !height) return null;

    const canvas = this.canvas ?? document.createElement('canvas');
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const roiX = Math.max(0, Math.floor(roiConfig.roi.left * width));
    const roiY = Math.max(0, Math.floor(roiConfig.roi.top * height));
    const roiWidth = Math.max(1, Math.floor(roiConfig.roi.width * width));
    const roiHeight = Math.max(1, Math.floor(roiConfig.roi.height * height));
    const targetWidth = Math.max(1, Math.floor(roiWidth * COIN_OCR_SCALE));
    const targetHeight = Math.max(1, Math.floor(roiHeight * COIN_OCR_SCALE));

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }

    ctx.drawImage(source, roiX, roiY, roiWidth, roiHeight, 0, 0, targetWidth, targetHeight);
    const rawPreviewDataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
    if (!hasPromptFrame(imageData)) {
      return null;
    }
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] ?? 0;
      const g = data[i + 1] ?? 0;
      const b = data[i + 2] ?? 0;
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const v = lum > COIN_OCR_LUMINANCE_THRESHOLD ? 255 : 0;
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);
    return {
      dataUrl: canvas.toDataURL('image/png'),
      rawPreviewDataUrl,
      processedPreviewDataUrl: canvas.toDataURL('image/png'),
      roi: {
        label: roiConfig.label,
        x: roiX,
        y: roiY,
        width: roiWidth,
        height: roiHeight,
        targetWidth,
        targetHeight,
      },
    };
  }

  private async analyzeSource(
    source: CanvasImageSource,
    sourceWidth: number,
    sourceHeight: number,
    options?: {
      captureToken?: number;
      getCaptureToken?: () => number;
      getIsCapturing?: () => boolean;
      includeCoinText?: boolean;
      includeResultText?: boolean;
    },
  ): Promise<CoinOcrSnapshot | null> {
    if (options?.getIsCapturing && !options.getIsCapturing()) return null;
    this.diagnostics.lastAttemptAt = Date.now();
    this.diagnostics.lastError = null;
    this.diagnostics.lastSkipReason = null;

    try {
      const worker = await this.ensureWorker();
      let bestCoinAttempt: OcrAttempt | null = null;
      let bestResultAttempt: OcrAttempt | null = null;
      let sawPromptFrame = false;

      const shouldScanCoinText = options?.includeCoinText ?? true;
      const shouldScanResultText = options?.includeResultText ?? false;

      if (shouldScanCoinText) {
        for (const roiConfig of COIN_OCR_ROIS) {
          const captured = this.captureImage(source, sourceWidth, sourceHeight, roiConfig);
          if (!captured) continue;
          sawPromptFrame = true;

          const { data } = await worker.recognize(captured.dataUrl as never);
          if (
            options?.captureToken != null &&
            options.getCaptureToken &&
            options.getCaptureToken() !== options.captureToken
          ) {
            return null;
          }
          if (options?.getIsCapturing && !options.getIsCapturing()) {
            return null;
          }

          const text = data.text ?? '';
          const parsed = parseCoinText(text);
          const turnOrder = parseTurnOrderText(text);
          const attempt: OcrAttempt = {
            ...captured,
            text,
            parsed,
            turnOrder,
            detection: null,
          };

          if (
            !bestCoinAttempt ||
            (attempt.parsed ? 2 : attempt.turnOrder ? 1 : 0) >
              (bestCoinAttempt.parsed ? 2 : bestCoinAttempt.turnOrder ? 1 : 0) ||
            text.replace(/\s+/g, '').length > bestCoinAttempt.text.replace(/\s+/g, '').length
          ) {
            bestCoinAttempt = attempt;
          }

          if (parsed || turnOrder) {
            bestCoinAttempt = attempt;
            break;
          }
        }
      }

      if (shouldScanResultText) {
        for (const roiConfig of RESULT_MESSAGE_OCR_ROIS) {
          const captured = this.captureImage(source, sourceWidth, sourceHeight, roiConfig);
          if (!captured) continue;

          const { data } = await worker.recognize(captured.dataUrl as never);
          if (
            options?.captureToken != null &&
            options.getCaptureToken &&
            options.getCaptureToken() !== options.captureToken
          ) {
            return null;
          }
          if (options?.getIsCapturing && !options.getIsCapturing()) {
            return null;
          }

          const text = data.text ?? '';
          const detection = parseResultMessageText(text);
          const attempt: OcrAttempt = {
            ...captured,
            text,
            parsed: null,
            turnOrder: null,
            detection,
          };

          if (
            !bestResultAttempt ||
            (attempt.detection ? 1 : 0) > (bestResultAttempt.detection ? 1 : 0) ||
            text.replace(/\s+/g, '').length > bestResultAttempt.text.replace(/\s+/g, '').length
          ) {
            bestResultAttempt = attempt;
          }

          if (detection) {
            bestResultAttempt = attempt;
            break;
          }
        }
      }

      if (!bestCoinAttempt && !bestResultAttempt) {
        if (!sawPromptFrame) {
          this.diagnostics.lastSkipReason = 'no_prompt_frame';
        }
        return null;
      }

      const now = Date.now();
      this.diagnostics.lastCompletedAt = now;
      this.diagnostics.lastRawText = bestCoinAttempt?.text ?? bestResultAttempt?.text ?? null;
      this.diagnostics.lastParsedResult = bestCoinAttempt?.parsed?.result ?? null;
      this.diagnostics.lastParsedConfidence = bestCoinAttempt?.parsed?.confidence ?? null;
      this.diagnostics.lastParsedIsFirst = bestCoinAttempt?.turnOrder?.isFirst ?? null;
      this.diagnostics.lastParsedDetectionResult = bestResultAttempt?.detection?.result ?? null;
      this.diagnostics.lastParsedDetectionConfidence =
        bestResultAttempt?.detection?.confidence ?? null;
      this.diagnostics.rawPreviewDataUrl =
        bestCoinAttempt?.rawPreviewDataUrl ?? bestResultAttempt?.rawPreviewDataUrl ?? null;
      this.diagnostics.processedPreviewDataUrl =
        bestCoinAttempt?.processedPreviewDataUrl ?? bestResultAttempt?.processedPreviewDataUrl ?? null;
      this.diagnostics.roi = bestCoinAttempt?.roi ?? bestResultAttempt?.roi ?? null;
      this.snapshot = {
        text: bestCoinAttempt?.text ?? '',
        result: bestCoinAttempt?.parsed?.result ?? null,
        confidence: bestCoinAttempt?.parsed?.confidence ?? 0,
        detectedIsFirst: bestCoinAttempt?.turnOrder?.isFirst ?? null,
        detectionResult: bestResultAttempt?.detection?.result ?? null,
        detectionConfidence: bestResultAttempt?.detection?.confidence ?? 0,
        detectionText: bestResultAttempt?.text ?? '',
        updatedAt: now,
        expiresAt:
          now +
          (bestCoinAttempt?.turnOrder
            ? TURN_ORDER_OCR_TTL_MS
            : bestCoinAttempt?.parsed?.result
              ? COIN_OCR_TTL_MS
              : COIN_OCR_IDLE_RESULT_TTL_MS),
      };
      return this.snapshot;
    } catch (error) {
      console.warn('[CoinOcrManager] OCR recognition failed:', error);
      this.diagnostics.lastCompletedAt = Date.now();
      this.diagnostics.lastError = stringifyError(error);
      if (
        options?.captureToken == null ||
        !options.getCaptureToken ||
        options.getCaptureToken() === options.captureToken
      ) {
        this.snapshot = null;
      }
      return null;
    }
  }

  async analyzeVideoFrame(video: HTMLVideoElement): Promise<CoinOcrSnapshot | null> {
    if (this.running) return null;

    this.running = true;
    this.diagnostics.lastAttemptAt = Date.now();
    this.diagnostics.lastError = null;
    this.diagnostics.lastSkipReason = null;

    try {
      return await this.analyzeSource(video, video.videoWidth, video.videoHeight);
    } catch (error) {
      this.diagnostics.lastCompletedAt = Date.now();
      this.diagnostics.lastError = stringifyError(error);
      this.snapshot = null;
      return null;
    } finally {
      this.running = false;
    }
  }

  async analyzeBitmapFrame(frame: {
    bitmap: ImageBitmap;
    width: number;
    height: number;
  }): Promise<CoinOcrSnapshot | null> {
    if (this.running) return null;

    this.running = true;
    this.diagnostics.lastAttemptAt = Date.now();
    this.diagnostics.lastError = null;
    this.diagnostics.lastSkipReason = null;

    try {
      return await this.analyzeSource(frame.bitmap, frame.width, frame.height);
    } catch (error) {
      this.diagnostics.lastCompletedAt = Date.now();
      this.diagnostics.lastError = stringifyError(error);
      this.snapshot = null;
      return null;
    } finally {
      this.running = false;
    }
  }

  maybeRun(
    video: HTMLVideoElement,
    fsmState: FSMState,
    captureToken: number,
    getCaptureToken: () => number,
    getIsCapturing: () => boolean,
  ): void {
    if (this.running) {
      this.diagnostics.lastSkipReason = 'running';
      return;
    }
    if (!getIsCapturing()) {
      this.diagnostics.lastSkipReason = 'not_capturing';
      return;
    }

    const now = Date.now();
    if (now - this.lastOcrAt < COIN_OCR_INTERVAL_MS) {
      this.diagnostics.lastSkipReason = 'rate_limited';
      return;
    }

    this.lastOcrAt = now;
    this.running = true;
    const includeCoinText =
      fsmState === 'idle' || fsmState === 'coinDetecting' || fsmState === 'coinDetected';
    const includeResultText =
      fsmState === 'coinDetected' ||
      fsmState === 'resultDetecting' ||
      fsmState === 'resultDetected' ||
      fsmState === 'cooldown';
    void this
      .analyzeSource(video, video.videoWidth, video.videoHeight, {
        captureToken,
        getCaptureToken,
        getIsCapturing,
        includeCoinText,
        includeResultText,
      })
      .finally(() => {
        this.running = false;
      });
  }

  reset(): void {
    this.snapshot = null;
    this.running = false;
    this.lastOcrAt = 0;
    this.diagnostics = createInitialDiagnostics();
  }

  dispose(): void {
    if (this.worker) {
      void this.worker.terminate();
      this.worker = null;
    }
    this.workerPromise = null;
    this.canvas = null;
    this.reset();
  }
}
