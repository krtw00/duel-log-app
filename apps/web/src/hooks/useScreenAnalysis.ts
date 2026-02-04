import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { COIN_ROI, SCAN_FPS } from '../utils/screenAnalysis/config.js';
import { createInitialContext, transition } from '../utils/screenAnalysis/fsm.js';
import type {
  AnalysisFrame,
  CoinResult,
  DetectionResult,
  FSMContext,
  ScreenAnalysisStatus,
} from '../utils/screenAnalysis/types.js';

type AutoRegisterCallback = (data: {
  coin: CoinResult;
  isFirst: boolean;
  result: DetectionResult;
}) => void;

type ScreenAnalysisOptions = {
  debugLogEnabled?: boolean;
  debugLogIntervalMs?: number;
};

type TesseractModule = typeof import('tesseract.js');
type TesseractWorker = Awaited<ReturnType<TesseractModule['createWorker']>>;

type CoinOcrSnapshot = {
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

export function useScreenAnalysis(
  onAutoRegister?: AutoRegisterCallback,
  options: ScreenAnalysisOptions = {},
) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [autoRegister, setAutoRegister] = useState(false);
  const [fsmContext, setFsmContext] = useState<FSMContext>(createInitialContext);
  const [lastFrame, setLastFrame] = useState<AnalysisFrame | null>(null);
  const lastFrameRef = useRef<AnalysisFrame | null>(null);
  const { debugLogEnabled = false, debugLogIntervalMs = 2000 } = options;

  const workerRef = useRef<Worker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<OffscreenCanvas | null>(null);
  const intervalRef = useRef<number | null>(null);
  const fsmRef = useRef<FSMContext>(createInitialContext());
  const autoRegisterRef = useRef(autoRegister);
  const isCapturingRef = useRef(false);
  const ocrWorkerRef = useRef<TesseractWorker | null>(null);
  const ocrWorkerPromiseRef = useRef<Promise<TesseractWorker> | null>(null);
  const ocrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const ocrRunningRef = useRef(false);
  const lastOcrAtRef = useRef(0);
  const coinOcrRef = useRef<CoinOcrSnapshot | null>(null);
  const captureTokenRef = useRef(0);

  useEffect(() => {
    autoRegisterRef.current = autoRegister;
  }, [autoRegister]);

  useEffect(() => {
    isCapturingRef.current = isCapturing;
  }, [isCapturing]);

  // Handle auto-registration when result is detected
  useEffect(() => {
    if (fsmContext.state === 'resultDetected' && autoRegisterRef.current && onAutoRegister) {
      const { coinResult, detectionResult } = fsmContext;
      setTimeout(() => {
        onAutoRegister({
          coin: coinResult,
          isFirst: coinResult === 'won',
          result: detectionResult,
        });
      }, 500);
    }
  }, [fsmContext, onAutoRegister]);

  const handleWorkerMessage = useCallback((event: MessageEvent) => {
    if (event.data.type === 'result') {
      let frame: AnalysisFrame = event.data.data;
      const ocrSnapshot = coinOcrRef.current;
      if (ocrSnapshot && ocrSnapshot.expiresAt >= frame.timestamp && ocrSnapshot.result) {
        frame = {
          ...frame,
          coin: ocrSnapshot.result,
          coinConfidence: Math.max(frame.coinConfidence, ocrSnapshot.confidence),
        };
      }
      const newContext = transition(fsmRef.current, frame);
      fsmRef.current = newContext;
      setFsmContext(newContext);
      setLastFrame(frame);
      lastFrameRef.current = frame;
    }
  }, []);

  const stopCapture = useCallback(() => {
    captureTokenRef.current += 1;
    isCapturingRef.current = false;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
      videoRef.current = null;
    }
    if (ocrWorkerRef.current) {
      void ocrWorkerRef.current.terminate();
      ocrWorkerRef.current = null;
    }
    ocrWorkerPromiseRef.current = null;
    ocrRunningRef.current = false;
    coinOcrRef.current = null;
    canvasRef.current = null;
    fsmRef.current = createInitialContext();
    setFsmContext(createInitialContext());
    setLastFrame(null);
    lastFrameRef.current = null;
    setIsCapturing(false);
  }, []);

  const ensureOcrWorker = useCallback(async (): Promise<TesseractWorker> => {
    if (ocrWorkerRef.current) return ocrWorkerRef.current;
    if (ocrWorkerPromiseRef.current) return ocrWorkerPromiseRef.current;

    ocrWorkerPromiseRef.current = (async () => {
      const module = await import('tesseract.js');
      const worker = await module.createWorker('jpn');
      await worker.setParameters({
        tessedit_pageseg_mode: '7',
      });
      ocrWorkerRef.current = worker;
      return worker;
    })().catch((error) => {
      ocrWorkerPromiseRef.current = null;
      throw error;
    });

    return ocrWorkerPromiseRef.current;
  }, []);

  const captureCoinOcrImage = useCallback((video: HTMLVideoElement): ImageData | null => {
    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) return null;

    const canvas = ocrCanvasRef.current ?? document.createElement('canvas');
    ocrCanvasRef.current = canvas;
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
      const lum = 0.2126 * data[i]! + 0.7152 * data[i + 1]! + 0.0722 * data[i + 2]!;
      const v = lum > COIN_OCR_LUMINANCE_THRESHOLD ? 255 : 0;
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = 255;
    }
    return imageData;
  }, []);

  const parseCoinOcrText = useCallback((text: string) => {
    const cleaned = text.replace(/\s+/g, '').replace(/[|｜]/g, '');
    const isLost =
      /対戦相手/.test(cleaned) ||
      /相手/.test(cleaned) ||
      /選択してい/.test(cleaned) ||
      /選択しています/.test(cleaned);
    const isWon = /選択してくだ/.test(cleaned) || /選択してください/.test(cleaned) || /選択して下さい/.test(cleaned);

    if (isLost) return { result: 'lost' as const, confidence: 0.92 };
    if (isWon) return { result: 'won' as const, confidence: 0.92 };
    return null;
  }, []);

  const runCoinOcr = useCallback(async () => {
    if (!videoRef.current) return;
    if (!isCapturingRef.current) return;
    if (fsmRef.current.state !== 'idle' && fsmRef.current.state !== 'coinDetecting') return;

    const token = captureTokenRef.current;
    const imageData = captureCoinOcrImage(videoRef.current);
    if (!imageData) return;

    try {
      const worker = await ensureOcrWorker();
      const { data } = await worker.recognize(imageData);
      if (captureTokenRef.current !== token || !isCapturingRef.current) return;

      const text = data.text ?? '';
      const parsed = parseCoinOcrText(text);
      const now = Date.now();
      coinOcrRef.current = {
        text,
        result: parsed?.result ?? null,
        confidence: parsed?.confidence ?? 0,
        updatedAt: now,
        expiresAt: now + COIN_OCR_TTL_MS,
      };
    } catch {
      if (captureTokenRef.current === token) {
        coinOcrRef.current = null;
      }
    }
  }, [captureCoinOcrImage, ensureOcrWorker, parseCoinOcrText]);

  const maybeRunCoinOcr = useCallback(() => {
    if (ocrRunningRef.current) return;
    if (!isCapturingRef.current) return;
    if (!videoRef.current) return;
    if (fsmRef.current.state !== 'idle' && fsmRef.current.state !== 'coinDetecting') return;

    const now = Date.now();
    if (coinOcrRef.current && coinOcrRef.current.expiresAt > now) return;
    if (now - lastOcrAtRef.current < COIN_OCR_INTERVAL_MS) return;

    lastOcrAtRef.current = now;
    ocrRunningRef.current = true;
    void runCoinOcr().finally(() => {
      ocrRunningRef.current = false;
    });
  }, [runCoinOcr]);

  const startCapture = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: SCAN_FPS },
      });
      streamRef.current = stream;

      // Create video element
      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      await video.play();
      videoRef.current = video;

      // Create worker
      const worker = new Worker(new URL('../workers/screenAnalysis.worker.ts', import.meta.url), {
        type: 'module',
      });
      worker.onmessage = handleWorkerMessage;
      workerRef.current = worker;

      // Create canvas for frame capture
      canvasRef.current = new OffscreenCanvas(video.videoWidth, video.videoHeight);

      captureTokenRef.current += 1;
      isCapturingRef.current = true;
      lastOcrAtRef.current = 0;
      coinOcrRef.current = null;

      // Start scanning interval
      const scanInterval = 1000 / SCAN_FPS;
      intervalRef.current = window.setInterval(() => {
        if (!videoRef.current || !canvasRef.current || !workerRef.current) return;

        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
        workerRef.current.postMessage({ type: 'analyze', imageData }, [imageData.data.buffer]);
        maybeRunCoinOcr();
      }, scanInterval);

      setIsCapturing(true);

      // Handle stream end (user clicks "Stop Sharing")
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.addEventListener('ended', () => {
          stopCapture();
        });
      }
    } catch {
      // User cancelled or not supported
    }
  }, [handleWorkerMessage, maybeRunCoinOcr, stopCapture]);

  useEffect(() => {
    if (!debugLogEnabled || !isCapturing) return;

    const intervalId = window.setInterval(() => {
      const frame = lastFrameRef.current;
      if (!frame) return;
      const ocrSnapshot =
        coinOcrRef.current && coinOcrRef.current.expiresAt >= frame.timestamp
          ? coinOcrRef.current
          : null;
      const payload = {
        eventAt: frame.timestamp,
        state: fsmRef.current.state,
        coin: frame.coin,
        result: frame.result,
        coinWinScore: frame.coinWinScore,
        coinLossScore: frame.coinLossScore,
        resultWinScore: frame.resultWinScore,
        resultLossScore: frame.resultLossScore,
        coinConfidence: frame.coinConfidence,
        resultConfidence: frame.resultConfidence,
        coinOcrText: ocrSnapshot?.text?.slice(0, 120),
        coinOcrResult: ocrSnapshot?.result ?? null,
        coinOcrConfidence: ocrSnapshot?.confidence,
        coinOcrAt: ocrSnapshot?.updatedAt,
      };
      void api('/debug/screen-analysis', { method: 'POST', body: payload }).catch(() => {});
    }, debugLogIntervalMs);

    return () => {
      clearInterval(intervalId);
    };
  }, [debugLogEnabled, debugLogIntervalMs, isCapturing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCapture();
    };
  }, [stopCapture]);

  const status: ScreenAnalysisStatus = {
    state: fsmContext.state,
    coinResult: fsmContext.coinResult,
    detectionResult: fsmContext.detectionResult,
    isCapturing,
    autoRegister,
    lastFrame,
  };

  return {
    status,
    startCapture,
    stopCapture,
    autoRegister,
    setAutoRegister,
  };
}
