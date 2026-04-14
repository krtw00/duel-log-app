import type { TesseractWorker } from 'tesseract.js';
import { COIN_ROI } from './config.js';
import type { CoinResult, FSMState } from './types.js';

export type CoinOcrSnapshot = {
  text: string;
  result: CoinResult | null;
  confidence: number;
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
  rawPreviewDataUrl: string | null;
  processedPreviewDataUrl: string | null;
  roi:
    | {
        x: number;
        y: number;
        width: number;
        height: number;
        targetWidth: number;
        targetHeight: number;
      }
    | null;
};

const COIN_OCR_INTERVAL_MS = 1500;
const COIN_OCR_TTL_MS = 4000;
const COIN_OCR_SCALE = 2;
const COIN_OCR_LUMINANCE_THRESHOLD = 180;

function createInitialDiagnostics(): CoinOcrDiagnostics {
  return {
    lastSkipReason: null,
    lastAttemptAt: null,
    lastCompletedAt: null,
    lastError: null,
    lastRawText: null,
    lastParsedResult: null,
    lastParsedConfidence: null,
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
  const isOpponentSelecting =
    /\u5bfe\u6226\u76f8\u624b\u304c\u5148\u653b\u30fb\u5f8c\u653b\u3092\u9078\u629e\u3057\u3066\u3044\u307e\u3059/.test(
      cleaned,
    ) ||
    /\u5bfe\u6226\u76f8\u624b/.test(cleaned) ||
    /\u76f8\u624b/.test(cleaned) ||
    /\u9078\u629e\u3057\u3066\u3044/.test(cleaned) ||
    /\u9078\u629e\u3057\u3066\u3044\u307e\u3059/.test(cleaned);
  const isSelfSelecting =
    /\u5148\u653b\u30fb\u5f8c\u653b\u3092\u9078\u629e\u3057\u3066\u304f\u3060\u3055\u3044/.test(cleaned) ||
    /\u9078\u629e\u3057\u3066\u304f\u3060/.test(cleaned) ||
    /\u9078\u629e\u3057\u3066\u304f\u3060\u3055\u3044/.test(cleaned) ||
    /\u9078\u629e\u3057\u3066\u4e0b\u3055\u3044/.test(cleaned);

  if (isOpponentSelecting) return { state: 'opponentSelect', confidence: 0.92 };
  if (isSelfSelecting) return { state: 'selfSelect', confidence: 0.92 };
  return null;
}

export function parseCoinText(text: string): { result: CoinResult; confidence: number } | null {
  const parsed = parseSelectionPromptText(text);
  if (!parsed) return null;

  return {
    result: parsed.state === 'selfSelect' ? 'won' : 'lost',
    confidence: parsed.confidence,
  };
}

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

  private captureImage(video: HTMLVideoElement): ImageData | null {
    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) return null;

    const canvas = this.canvas ?? document.createElement('canvas');
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const roiX = Math.max(0, Math.floor(COIN_ROI.left * width));
    const roiY = Math.max(0, Math.floor(COIN_ROI.top * height));
    const roiWidth = Math.max(1, Math.floor(COIN_ROI.width * width));
    const roiHeight = Math.max(1, Math.floor(COIN_ROI.height * height));
    const targetWidth = Math.max(1, Math.floor(roiWidth * COIN_OCR_SCALE));
    const targetHeight = Math.max(1, Math.floor(roiHeight * COIN_OCR_SCALE));

    this.diagnostics.roi = {
      x: roiX,
      y: roiY,
      width: roiWidth,
      height: roiHeight,
      targetWidth,
      targetHeight,
    };

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }

    ctx.drawImage(video, roiX, roiY, roiWidth, roiHeight, 0, 0, targetWidth, targetHeight);
    this.diagnostics.rawPreviewDataUrl = canvas.toDataURL('image/jpeg', 0.85);
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
    this.diagnostics.processedPreviewDataUrl = canvas.toDataURL('image/png');
    return imageData;
  }

  private async run(
    video: HTMLVideoElement,
    captureToken: number,
    getCaptureToken: () => number,
    getIsCapturing: () => boolean,
  ): Promise<void> {
    if (!getIsCapturing()) return;

    const imageData = this.captureImage(video);
    if (!imageData) return;
    this.diagnostics.lastAttemptAt = Date.now();
    this.diagnostics.lastError = null;
    this.diagnostics.lastSkipReason = null;

    try {
      const worker = await this.ensureWorker();
      const { data } = await worker.recognize(imageData);
      if (getCaptureToken() !== captureToken || !getIsCapturing()) return;

      const text = data.text ?? '';
      const parsed = parseCoinText(text);
      const now = Date.now();
      this.diagnostics.lastCompletedAt = now;
      this.diagnostics.lastRawText = text;
      this.diagnostics.lastParsedResult = parsed?.result ?? null;
      this.diagnostics.lastParsedConfidence = parsed?.confidence ?? null;
      this.snapshot = {
        text,
        result: parsed?.result ?? null,
        confidence: parsed?.confidence ?? 0,
        updatedAt: now,
        expiresAt: now + COIN_OCR_TTL_MS,
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
    if (fsmState !== 'idle' && fsmState !== 'coinDetecting') {
      this.diagnostics.lastSkipReason = `fsm:${fsmState}`;
      return;
    }

    const now = Date.now();
    if (this.snapshot && this.snapshot.expiresAt > now) {
      this.diagnostics.lastSkipReason = 'snapshot_fresh';
      return;
    }
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
