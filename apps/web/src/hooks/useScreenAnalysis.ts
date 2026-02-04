import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { ScreenCapture } from '../utils/screenAnalysis/capture.js';
import { createInitialContext, transition } from '../utils/screenAnalysis/fsm.js';
import { CoinOcrManager } from '../utils/screenAnalysis/ocr.js';
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

  const captureRef = useRef(new ScreenCapture());
  const ocrRef = useRef(new CoinOcrManager());
  const workerRef = useRef<Worker | null>(null);
  const fsmRef = useRef<FSMContext>(createInitialContext());
  const autoRegisterRef = useRef(autoRegister);
  const isCapturingRef = useRef(false);
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
      const ocrSnapshot = ocrRef.current.snapshot;
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

    captureRef.current.stop();
    ocrRef.current.dispose();

    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }

    fsmRef.current = createInitialContext();
    setFsmContext(createInitialContext());
    setLastFrame(null);
    lastFrameRef.current = null;
    setIsCapturing(false);
  }, []);

  const startCapture = useCallback(async () => {
    const capture = captureRef.current;
    const ocr = ocrRef.current;

    // Create worker
    const worker = new Worker(new URL('../workers/screenAnalysis.worker.ts', import.meta.url), {
      type: 'module',
    });
    worker.onmessage = handleWorkerMessage;
    workerRef.current = worker;

    captureTokenRef.current += 1;
    const token = captureTokenRef.current;
    isCapturingRef.current = true;
    ocr.reset();

    const started = await capture.start(
      (imageData) => {
        if (!workerRef.current) return;
        workerRef.current.postMessage({ type: 'analyze', imageData }, [imageData.data.buffer]);
        if (capture.video) {
          ocr.maybeRun(
            capture.video,
            fsmRef.current.state,
            token,
            () => captureTokenRef.current,
            () => isCapturingRef.current,
          );
        }
      },
      () => stopCapture(),
    );

    if (!started) {
      worker.terminate();
      workerRef.current = null;
      isCapturingRef.current = false;
      return;
    }

    setIsCapturing(true);
  }, [handleWorkerMessage, stopCapture]);

  useEffect(() => {
    if (!debugLogEnabled || !isCapturing) return;

    const intervalId = window.setInterval(() => {
      const frame = lastFrameRef.current;
      if (!frame) return;
      const ocrSnapshot =
        ocrRef.current.snapshot && ocrRef.current.snapshot.expiresAt >= frame.timestamp
          ? ocrRef.current.snapshot
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
