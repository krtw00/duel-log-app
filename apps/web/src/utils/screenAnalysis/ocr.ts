import type { TesseractWorker } from 'tesseract.js';
import { COIN_OCR_ROIS } from './config.js';
import type { CoinResult, FSMState } from './types.js';

export type CoinOcrSnapshot = {
  text: string;
  result: CoinResult | null;
  confidence: number;
  detectedIsFirst: boolean | null;
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

const COIN_OCR_INTERVAL_MS = 500;
const COIN_OCR_TTL_MS = 4000;
const TURN_ORDER_OCR_TTL_MS = 2500;
const COIN_OCR_SCALE = 2;
const COIN_OCR_LUMINANCE_THRESHOLD = 180;
const COIN_OCR_IDLE_RESULT_TTL_MS = 0;

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
    rawPreviewDataUrl: null,
    processedPreviewDataUrl: null,
    roi: null,
  };
}

function stringifyError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function parseSelectionPromptText(
  text: string,
): { state: SelectionPromptState; confidence: number } | null {
  const cleaned = text.replace(/\s+/g, '').replace(/[|\uff5c]/g, '');
  const hasTurnWords = /\u5148\u653b|\u5148\u884c|\u5f8c\u653b/.test(cleaned);
  const hasSelectionWords =
    /\u9078\u629e/.test(cleaned) ||
    /\u9078\u629e\u3057\u3066\u3044/.test(cleaned) ||
    /\u9078\u629e\u3057\u3066\u304f\u3060/.test(cleaned);
  const isOpponentSelecting =
    /\u5bfe\u6226\u76f8\u624b\u304c\u5148\u653b\u30fb\u5f8c\u653b\u3092\u9078\u629e\u3057\u3066\u3044\u307e\u3059/.test(
      cleaned,
    ) ||
    (/\u5bfe\u6226\u76f8\u624b/.test(cleaned) &&
      hasTurnWords &&
      /\u9078\u629e\u3057\u3066\u3044/.test(cleaned));
  const isSelfSelecting =
    /\u5148\u653b\u30fb\u5f8c\u653b\u3092\u9078\u629e\u3057\u3066\u304f\u3060\u3055\u3044/.test(cleaned) ||
    (hasTurnWords &&
      hasSelectionWords &&
      !/\u5bfe\u6226\u76f8\u624b/.test(cleaned) &&
      !/\u3042\u306a\u305f\u304c/.test(cleaned) &&
      !/\u3042\u306a\u305f\u306f/.test(cleaned));

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

  const isSelfFirst =
    !hasOpponentRef &&
    !hasSelectionRef &&
    hasSelfRef &&
    /\u5148\u653b|\u5148\u884c/.test(cleaned);
  const isSelfSecond =
    !hasOpponentRef && !hasSelectionRef && hasSelfRef && /\u5f8c\u653b/.test(cleaned);

  if (isSelfFirst) return { isFirst: true, confidence: 0.96 };
  if (isSelfSecond) return { isFirst: false, confidence: 0.96 };
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
    video: HTMLVideoElement,
    roiConfig: (typeof COIN_OCR_ROIS)[number],
  ): CapturedImage | null {
    const width = video.videoWidth;
    const height = video.videoHeight;
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

    ctx.drawImage(video, roiX, roiY, roiWidth, roiHeight, 0, 0, targetWidth, targetHeight);
    const rawPreviewDataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
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

  private async run(
    video: HTMLVideoElement,
    captureToken: number,
    getCaptureToken: () => number,
    getIsCapturing: () => boolean,
  ): Promise<void> {
    if (!getIsCapturing()) return;

    this.diagnostics.lastAttemptAt = Date.now();
    this.diagnostics.lastError = null;
    this.diagnostics.lastSkipReason = null;

    try {
      const worker = await this.ensureWorker();
      let bestAttempt: OcrAttempt | null = null;

      for (const roiConfig of COIN_OCR_ROIS) {
        const captured = this.captureImage(video, roiConfig);
        if (!captured) continue;

        const { data } = await worker.recognize(captured.dataUrl as never);
        if (getCaptureToken() !== captureToken || !getIsCapturing()) return;

        const text = data.text ?? '';
        const parsed = parseCoinText(text);
        const turnOrder = parseTurnOrderText(text);
        const attempt: OcrAttempt = {
          ...captured,
          text,
          parsed,
          turnOrder,
        };

        if (
          !bestAttempt ||
          (attempt.parsed ? 2 : attempt.turnOrder ? 1 : 0) >
            (bestAttempt.parsed ? 2 : bestAttempt.turnOrder ? 1 : 0) ||
          text.replace(/\s+/g, '').length > bestAttempt.text.replace(/\s+/g, '').length
        ) {
          bestAttempt = attempt;
        }

        if (parsed || turnOrder) {
          bestAttempt = attempt;
          break;
        }
      }

      if (!bestAttempt) return;

      const now = Date.now();
      this.diagnostics.lastCompletedAt = now;
      this.diagnostics.lastRawText = bestAttempt.text;
      this.diagnostics.lastParsedResult = bestAttempt.parsed?.result ?? null;
      this.diagnostics.lastParsedConfidence = bestAttempt.parsed?.confidence ?? null;
      this.diagnostics.lastParsedIsFirst = bestAttempt.turnOrder?.isFirst ?? null;
      this.diagnostics.rawPreviewDataUrl = bestAttempt.rawPreviewDataUrl;
      this.diagnostics.processedPreviewDataUrl = bestAttempt.processedPreviewDataUrl;
      this.diagnostics.roi = bestAttempt.roi;
      this.snapshot = {
        text: bestAttempt.text,
        result: bestAttempt.parsed?.result ?? null,
        confidence: bestAttempt.parsed?.confidence ?? 0,
        detectedIsFirst: bestAttempt.turnOrder?.isFirst ?? null,
        updatedAt: now,
        expiresAt:
          now +
          (bestAttempt.turnOrder
            ? TURN_ORDER_OCR_TTL_MS
            : bestAttempt.parsed?.result
              ? COIN_OCR_TTL_MS
              : COIN_OCR_IDLE_RESULT_TTL_MS),
      };
    } catch (error) {
      console.warn('[CoinOcrManager] OCR recognition failed:', error);
      this.diagnostics.lastCompletedAt = Date.now();
      this.diagnostics.lastError = stringifyError(error);
      if (getCaptureToken() === captureToken) {
        this.snapshot = null;
      }
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
    if (fsmState !== 'idle' && fsmState !== 'coinDetecting' && fsmState !== 'coinDetected') {
      this.diagnostics.lastSkipReason = `fsm:${fsmState}`;
      return;
    }

    const now = Date.now();
    if (now - this.lastOcrAt < COIN_OCR_INTERVAL_MS) {
      this.diagnostics.lastSkipReason = 'rate_limited';
      return;
    }

    this.lastOcrAt = now;
    this.running = true;
    void this.run(video, captureToken, getCaptureToken, getIsCapturing).finally(() => {
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
