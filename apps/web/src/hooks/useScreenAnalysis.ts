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
  const lastLoggedPreviewAtRef = useRef<number | null>(null);
  const debugSessionIdRef = useRef(
    globalThis.crypto?.randomUUID?.() ?? `screen-analysis-${Date.now().toString(36)}`,
  );

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

  const logDebugEvent = useCallback(
    (payload: Record<string, unknown>) => {
      if (!debugLogEnabled) return;
      void api('/debug/screen-analysis', {
        method: 'POST',
        body: {
          sessionId: debugSessionIdRef.current,
          captureToken: captureTokenRef.current,
          ...payload,
        },
      }).catch(() => {});
    },
    [debugLogEnabled],
  );

  const handleWorkerMessage = useCallback(
    (event: MessageEvent) => {
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
        const prevContext = fsmRef.current;
        const newContext = transition(prevContext, frame);
        const ocrDiagnostics = ocrRef.current.getDiagnostics();
        if (
          debugLogEnabled &&
          (prevContext.state !== newContext.state ||
            prevContext.coinResult !== newContext.coinResult ||
            prevContext.detectionResult !== newContext.detectionResult)
        ) {
          logDebugEvent({
            type: 'fsm_transition',
            eventAt: frame.timestamp,
            prevState: prevContext.state,
            nextState: newContext.state,
            prevCoin: prevContext.coinResult,
            nextCoin: newContext.coinResult,
            prevResult: prevContext.detectionResult,
            nextResult: newContext.detectionResult,
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
            ocrLastSkipReason: ocrDiagnostics.lastSkipReason,
            ocrLastAttemptAt: ocrDiagnostics.lastAttemptAt,
            ocrLastCompletedAt: ocrDiagnostics.lastCompletedAt,
            ocrLastError: ocrDiagnostics.lastError,
            ocrLastRawText: ocrDiagnostics.lastRawText?.slice(0, 120) ?? null,
            ocrLastParsedResult: ocrDiagnostics.lastParsedResult,
            ocrLastParsedConfidence: ocrDiagnostics.lastParsedConfidence,
            ocrRoi: ocrDiagnostics.roi,
          });
        }
        fsmRef.current = newContext;
        setFsmContext(newContext);
        setLastFrame(frame);
        lastFrameRef.current = frame;
      }
    },
    [debugLogEnabled, logDebugEvent],
  );

  const stopCapture = useCallback(() => {
    const finalContext = fsmRef.current;
    const finalFrame = lastFrameRef.current;
    const ocrDiagnostics = ocrRef.current.getDiagnostics();
    logDebugEvent({
      type: 'capture_stopped',
      eventAt: Date.now(),
      state: finalContext.state,
      coin: finalContext.coinResult,
      result: finalContext.detectionResult,
      coinWinScore: finalFrame?.coinWinScore,
      coinLossScore: finalFrame?.coinLossScore,
      resultWinScore: finalFrame?.resultWinScore,
      resultLossScore: finalFrame?.resultLossScore,
      coinConfidence: finalFrame?.coinConfidence,
      resultConfidence: finalFrame?.resultConfidence,
      ocrLastSkipReason: ocrDiagnostics.lastSkipReason,
      ocrLastAttemptAt: ocrDiagnostics.lastAttemptAt,
      ocrLastCompletedAt: ocrDiagnostics.lastCompletedAt,
      ocrLastError: ocrDiagnostics.lastError,
      ocrLastRawText: ocrDiagnostics.lastRawText?.slice(0, 120) ?? null,
      ocrLastParsedResult: ocrDiagnostics.lastParsedResult,
      ocrLastParsedConfidence: ocrDiagnostics.lastParsedConfidence,
      ocrRoi: ocrDiagnostics.roi,
    });
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
  }, [logDebugEvent]);

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
    lastLoggedPreviewAtRef.current = null;

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
      logDebugEvent({
        type: 'capture_denied',
        eventAt: Date.now(),
      });
      worker.terminate();
      workerRef.current = null;
      isCapturingRef.current = false;
      return;
    }

    logDebugEvent({
      type: 'capture_started',
      eventAt: Date.now(),
      captureWidth: capture.video?.videoWidth ?? null,
      captureHeight: capture.video?.videoHeight ?? null,
    });
    setIsCapturing(true);
  }, [handleWorkerMessage, logDebugEvent, stopCapture]);

  useEffect(() => {
    if (!debugLogEnabled || !isCapturing) return;

    const intervalId = window.setInterval(() => {
      const frame = lastFrameRef.current;
      if (!frame) return;
      const ocrSnapshot =
        ocrRef.current.snapshot && ocrRef.current.snapshot.expiresAt >= frame.timestamp
          ? ocrRef.current.snapshot
          : null;
      const ocrDiagnostics = ocrRef.current.getDiagnostics();
      const includePreviewImages =
        ocrDiagnostics.lastCompletedAt != null &&
        ocrDiagnostics.lastCompletedAt !== lastLoggedPreviewAtRef.current;
      const payload = {
        type: 'tick',
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
        ocrLastSkipReason: ocrDiagnostics.lastSkipReason,
        ocrLastAttemptAt: ocrDiagnostics.lastAttemptAt,
        ocrLastCompletedAt: ocrDiagnostics.lastCompletedAt,
        ocrLastError: ocrDiagnostics.lastError,
        ocrLastRawText: ocrDiagnostics.lastRawText?.slice(0, 120) ?? null,
        ocrLastParsedResult: ocrDiagnostics.lastParsedResult,
        ocrLastParsedConfidence: ocrDiagnostics.lastParsedConfidence,
        ocrRoi: ocrDiagnostics.roi,
        ...(includePreviewImages
          ? {
              ocrRawImageDataUrl: ocrDiagnostics.rawPreviewDataUrl,
              ocrProcessedImageDataUrl: ocrDiagnostics.processedPreviewDataUrl,
            }
          : {}),
      };
      if (includePreviewImages) {
        lastLoggedPreviewAtRef.current = ocrDiagnostics.lastCompletedAt;
      }
      logDebugEvent(payload);
    }, debugLogIntervalMs);

    return () => {
      clearInterval(intervalId);
    };
  }, [debugLogEnabled, debugLogIntervalMs, isCapturing, logDebugEvent]);

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
