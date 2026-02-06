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

const COIN_OCR_INTERVAL_MS = 1500;
const COIN_OCR_TTL_MS = 4000;
const COIN_OCR_SCALE = 2;
const COIN_OCR_LUMINANCE_THRESHOLD = 180;

export function parseCoinText(text: string): { result: CoinResult; confidence: number } | null {
  const cleaned = text.replace(/\s+/g, '').replace(/[|｜]/g, '');
  const isLost =
    /対戦相手/.test(cleaned) ||
    /相手/.test(cleaned) ||
    /選択してい/.test(cleaned) ||
    /選択しています/.test(cleaned);
  const isWon =
    /選択してくだ/.test(cleaned) ||
    /選択してください/.test(cleaned) ||
    /選択して下さい/.test(cleaned);

  if (isLost) return { result: 'lost', confidence: 0.92 };
  if (isWon) return { result: 'won', confidence: 0.92 };
  return null;
}

export class CoinOcrManager {
  snapshot: CoinOcrSnapshot | null = null;

  private worker: TesseractWorker | null = null;
  private workerPromise: Promise<TesseractWorker> | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private running = false;
  private lastOcrAt = 0;

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

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }

    ctx.drawImage(video, roiX, roiY, roiWidth, roiHeight, 0, 0, targetWidth, targetHeight);
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

    try {
      const worker = await this.ensureWorker();
      const { data } = await worker.recognize(imageData);
      if (getCaptureToken() !== captureToken || !getIsCapturing()) return;

      const text = data.text ?? '';
      const parsed = parseCoinText(text);
      const now = Date.now();
      this.snapshot = {
        text,
        result: parsed?.result ?? null,
        confidence: parsed?.confidence ?? 0,
        updatedAt: now,
        expiresAt: now + COIN_OCR_TTL_MS,
      };
    } catch (error) {
      console.warn('[CoinOcrManager] OCR recognition failed:', error);
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
    if (this.running) return;
    if (!getIsCapturing()) return;
    if (fsmState !== 'idle' && fsmState !== 'coinDetecting') return;

    const now = Date.now();
    if (this.snapshot && this.snapshot.expiresAt > now) return;
    if (now - this.lastOcrAt < COIN_OCR_INTERVAL_MS) return;

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
