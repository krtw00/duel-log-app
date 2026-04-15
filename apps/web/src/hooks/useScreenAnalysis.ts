import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { ScreenCapture } from '../utils/screenAnalysis/capture.js';
import {
  COIN_OCR_CONFIRM_ROI,
  COIN_OCR_ROI,
  COIN_OCR_SELECTION_ROI,
  COIN_ROI,
  RESULT_MESSAGE_OCR_ROI,
  RESULT_CENTER_ROI,
  RESULT_ROI,
  RESULT_TEXT_ROI,
} from '../utils/screenAnalysis/config.js';
import { createInitialContext, transition } from '../utils/screenAnalysis/fsm.js';
import { CoinOcrManager } from '../utils/screenAnalysis/ocr.js';
import type { CoinOcrSnapshot } from '../utils/screenAnalysis/ocr.js';
import type {
  AnalysisFrame,
  CoinResult,
  DetectionResult,
  FSMContext,
  ROI,
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

const REPLAY_LOOKBACK_MS = 2_500;
const AUTO_REPLAY_LOOKBACK_MS = 1_800;
const AUTO_REPLAY_INTERVAL_MS = 1_500;
const AUTO_REPLAY_POLL_MS = 600;

function captureVideoRegion(video: HTMLVideoElement, roi: ROI): string | null {
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (!width || !height) return null;

  const x = Math.max(0, Math.floor(roi.left * width));
  const y = Math.max(0, Math.floor(roi.top * height));
  const cropWidth = Math.max(1, Math.floor(roi.width * width));
  const cropHeight = Math.max(1, Math.floor(roi.height * height));

  const canvas = document.createElement('canvas');
  canvas.width = cropWidth;
  canvas.height = cropHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.drawImage(video, x, y, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
  return canvas.toDataURL('image/jpeg', 0.9);
}

function captureVideoPreviewWithRois(
  video: HTMLVideoElement,
  rois: Array<{ roi: ROI; color: string; label: string }>,
): string | null {
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (!width || !height) return null;

  const targetWidth = Math.min(width, 1280);
  const scale = targetWidth / width;
  const targetHeight = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
  ctx.lineWidth = Math.max(2, Math.round(3 * scale));
  ctx.font = `${Math.max(14, Math.round(20 * scale))}px sans-serif`;

  for (const { roi, color, label } of rois) {
    const x = Math.round(roi.left * targetWidth);
    const y = Math.round(roi.top * targetHeight);
    const cropWidth = Math.round(roi.width * targetWidth);
    const cropHeight = Math.round(roi.height * targetHeight);

    ctx.strokeStyle = color;
    ctx.strokeRect(x, y, cropWidth, cropHeight);

    const labelPaddingX = 8;
    const labelHeight = Math.max(18, Math.round(26 * scale));
    const labelWidth = Math.ceil(ctx.measureText(label).width) + labelPaddingX * 2;
    const labelY = Math.max(0, y - labelHeight);

    ctx.fillStyle = color;
    ctx.fillRect(x, labelY, labelWidth, labelHeight);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, x + labelPaddingX, labelY + labelHeight - Math.max(5, Math.round(7 * scale)));
  }

  return canvas.toDataURL('image/jpeg', 0.82);
}

export function useScreenAnalysis(
  onAutoRegister?: AutoRegisterCallback,
  options: ScreenAnalysisOptions = {},
) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [autoRegister, setAutoRegister] = useState(false);
  const [fsmContext, setFsmContext] = useState<FSMContext>(createInitialContext);
  const [lastFrame, setLastFrame] = useState<AnalysisFrame | null>(null);
  const [detectedIsFirst, setDetectedIsFirst] = useState<boolean | null>(null);
  const lastFrameRef = useRef<AnalysisFrame | null>(null);
  const { debugLogEnabled = false, debugLogIntervalMs = 2000 } = options;

  const captureRef = useRef(new ScreenCapture());
  const ocrRef = useRef(new CoinOcrManager());
  const replayOcrRef = useRef(new CoinOcrManager());
  const workerRef = useRef<Worker | null>(null);
  const fsmRef = useRef<FSMContext>(createInitialContext());
  const autoRegisterRef = useRef(autoRegister);
  const isCapturingRef = useRef(false);
  const captureTokenRef = useRef(0);
  const lastLoggedPreviewAtRef = useRef<number | null>(null);
  const detectedIsFirstRef = useRef<boolean | null>(null);
  const replayRunningRef = useRef(false);
  const lastReplayAtRef = useRef(0);
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
      const resolvedIsFirst = detectedIsFirstRef.current ?? coinResult === 'won';
      setTimeout(() => {
        onAutoRegister({
          coin: coinResult,
          isFirst: resolvedIsFirst,
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

  const replaceOcrManagers = useCallback(() => {
    ocrRef.current.dispose();
    ocrRef.current = new CoinOcrManager();
    replayOcrRef.current.dispose();
    replayOcrRef.current = new CoinOcrManager();
    replayRunningRef.current = false;
    lastReplayAtRef.current = 0;
  }, []);

  const replayRecentClip = useCallback(async ({
    reason,
    lookbackMs = REPLAY_LOOKBACK_MS,
  }: {
    reason: 'manual_reset' | 'auto_backfill';
    lookbackMs?: number;
  }) => {
    if (replayRunningRef.current) return;

    replayRunningRef.current = true;
    lastReplayAtRef.current = Date.now();
    const frames = await captureRef.current.exportRecentFrames();
    if (frames.length === 0) {
      logDebugEvent({
        type: 'analysis_replay_miss',
        eventAt: Date.now(),
        replayReason: reason,
        reason: 'no_frames',
      });
      replayRunningRef.current = false;
      return;
    }

    try {
      const lastCapturedAt = frames[frames.length - 1]?.capturedAt ?? Date.now();
      const startMs = Math.max(0, lastCapturedAt - lookbackMs);
      const replayFrames = frames.filter((frame) => frame.capturedAt >= startMs).reverse();
      let bestMatch: {
        snapshot: CoinOcrSnapshot;
        replayAtMs: number | null;
        totalConfidence: number;
        hits: number;
      } | null = null;

      for (const frame of replayFrames) {
        const snapshot = await replayOcrRef.current.analyzeBitmapFrame(frame);
        if (!snapshot || (snapshot.result == null && snapshot.detectedIsFirst == null)) {
          continue;
        }

        const confidence = Math.max(
          snapshot.confidence,
          snapshot.detectedIsFirst == null ? 0 : 0.9,
        );

        if (
          !bestMatch ||
          confidence > bestMatch.totalConfidence ||
          (confidence === bestMatch.totalConfidence &&
            (bestMatch.replayAtMs == null || frame.capturedAt > bestMatch.replayAtMs))
        ) {
          bestMatch = {
            snapshot,
            replayAtMs: frame.capturedAt,
            totalConfidence: confidence,
            hits: 1,
          };
        } else if (
          bestMatch &&
          bestMatch.snapshot.result === snapshot.result &&
          bestMatch.snapshot.detectedIsFirst === snapshot.detectedIsFirst
        ) {
          bestMatch = {
            snapshot: bestMatch.snapshot,
            replayAtMs: bestMatch.replayAtMs,
            totalConfidence: bestMatch.totalConfidence + confidence,
            hits: bestMatch.hits + 1,
          };
        }
      }

      if (!bestMatch?.snapshot) {
        logDebugEvent({
          type: 'analysis_replay_miss',
          eventAt: Date.now(),
          replayReason: reason,
          replayFrameCount: replayFrames.length,
        });
        return;
      }

      const { snapshot, replayAtMs, totalConfidence, hits } = bestMatch;
      if (snapshot.detectedIsFirst != null) {
        detectedIsFirstRef.current = snapshot.detectedIsFirst;
        setDetectedIsFirst(snapshot.detectedIsFirst);
      }

      const replayCoinResult =
        snapshot.result ??
        (snapshot.detectedIsFirst == null ? null : snapshot.detectedIsFirst ? 'won' : 'lost');

      if (replayCoinResult) {
        ocrRef.current.snapshot = snapshot;
        const replayFrame: AnalysisFrame = {
          coin: replayCoinResult,
          coinConfidence: Math.max(snapshot.confidence, totalConfidence / hits),
          coinWinScore: 0,
          coinLossScore: 0,
          result: null,
          resultConfidence: 0,
          resultWinScore: 0,
          resultLossScore: 0,
          timestamp: Date.now(),
        };
        const nextContext = transition(fsmRef.current, replayFrame);
        fsmRef.current = nextContext;
        setFsmContext(nextContext);
        setLastFrame(replayFrame);
        lastFrameRef.current = replayFrame;
      }

      logDebugEvent({
        type: 'analysis_replay_hit',
        eventAt: Date.now(),
        replayReason: reason,
        replayAtMs,
        replayFrameCount: replayFrames.length,
        replayHits: hits,
        coinOcrText: snapshot.text.slice(0, 120),
        coinOcrResult: snapshot.result ?? null,
        coinOcrConfidence: snapshot.confidence,
        coinOcrIsFirst: snapshot.detectedIsFirst,
      });
    } catch (error) {
      logDebugEvent({
        type: 'analysis_replay_error',
        eventAt: Date.now(),
        replayReason: reason,
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      for (const frame of frames) {
        frame.bitmap.close();
      }
      replayRunningRef.current = false;
    }
  }, [logDebugEvent]);

  const handleWorkerMessage = useCallback(
    (event: MessageEvent) => {
      if (event.data.type === 'result') {
        let frame: AnalysisFrame = event.data.data;
        const ocrSnapshot = ocrRef.current.snapshot;
        const freshOcrSnapshot =
          ocrSnapshot && ocrSnapshot.expiresAt >= frame.timestamp ? ocrSnapshot : null;
        if (freshOcrSnapshot?.detectedIsFirst != null) {
          detectedIsFirstRef.current = freshOcrSnapshot.detectedIsFirst;
          setDetectedIsFirst(freshOcrSnapshot.detectedIsFirst);
        }
        if (freshOcrSnapshot && freshOcrSnapshot.result) {
          frame = {
            ...frame,
            coin: freshOcrSnapshot.result,
            coinConfidence: Math.max(frame.coinConfidence, freshOcrSnapshot.confidence),
          };
        }
        if (freshOcrSnapshot?.detectionResult) {
          frame = {
            ...frame,
            result: freshOcrSnapshot.detectionResult,
            resultConfidence: Math.max(
              frame.resultConfidence,
              freshOcrSnapshot.detectionConfidence,
            ),
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
            coinOcrIsFirst: ocrSnapshot?.detectedIsFirst ?? null,
            coinOcrAt: ocrSnapshot?.updatedAt,
            resultOcrText: ocrSnapshot?.detectionText?.slice(0, 120) ?? null,
            resultOcrResult: ocrSnapshot?.detectionResult ?? null,
            resultOcrConfidence: ocrSnapshot?.detectionConfidence ?? null,
            ocrLastSkipReason: ocrDiagnostics.lastSkipReason,
            ocrLastAttemptAt: ocrDiagnostics.lastAttemptAt,
            ocrLastCompletedAt: ocrDiagnostics.lastCompletedAt,
            ocrLastError: ocrDiagnostics.lastError,
            ocrLastRawText: ocrDiagnostics.lastRawText?.slice(0, 120) ?? null,
            ocrLastParsedResult: ocrDiagnostics.lastParsedResult,
            ocrLastParsedConfidence: ocrDiagnostics.lastParsedConfidence,
            ocrLastParsedIsFirst: ocrDiagnostics.lastParsedIsFirst,
            ocrLastParsedDetectionResult: ocrDiagnostics.lastParsedDetectionResult,
            ocrLastParsedDetectionConfidence: ocrDiagnostics.lastParsedDetectionConfidence,
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

  const resetAnalysis = useCallback(async () => {
    captureTokenRef.current += 1;
    detectedIsFirstRef.current = null;
    setDetectedIsFirst(null);
    replaceOcrManagers();
    fsmRef.current = createInitialContext();
    setFsmContext(createInitialContext());
    setLastFrame(null);
    lastFrameRef.current = null;
    lastLoggedPreviewAtRef.current = null;

    logDebugEvent({
      type: 'analysis_reset',
      eventAt: Date.now(),
    });
    await replayRecentClip({ reason: 'manual_reset' });
  }, [logDebugEvent, replaceOcrManagers, replayRecentClip]);

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
      ocrLastParsedIsFirst: ocrDiagnostics.lastParsedIsFirst,
      ocrLastParsedDetectionResult: ocrDiagnostics.lastParsedDetectionResult,
      ocrLastParsedDetectionConfidence: ocrDiagnostics.lastParsedDetectionConfidence,
      ocrRoi: ocrDiagnostics.roi,
    });
    captureTokenRef.current += 1;
    isCapturingRef.current = false;
    detectedIsFirstRef.current = null;
    setDetectedIsFirst(null);

    captureRef.current.stop();
    replaceOcrManagers();

    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }

    fsmRef.current = createInitialContext();
    setFsmContext(createInitialContext());
    setLastFrame(null);
    lastFrameRef.current = null;
    setIsCapturing(false);
  }, [logDebugEvent, replaceOcrManagers]);

  const startCapture = useCallback(async () => {
    const capture = captureRef.current;

    // Create worker
    const worker = new Worker(new URL('../workers/screenAnalysis.worker.ts', import.meta.url), {
      type: 'module',
    });
    worker.onmessage = handleWorkerMessage;
    workerRef.current = worker;

    captureTokenRef.current += 1;
    isCapturingRef.current = true;
    detectedIsFirstRef.current = null;
    setDetectedIsFirst(null);
    replaceOcrManagers();
    lastLoggedPreviewAtRef.current = null;

    const started = await capture.start(
      (imageData) => {
        if (!workerRef.current) return;
        workerRef.current.postMessage({ type: 'analyze', imageData }, [imageData.data.buffer]);
        if (capture.video) {
          ocrRef.current.maybeRun(
            capture.video,
            fsmRef.current.state,
            captureTokenRef.current,
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
  }, [handleWorkerMessage, logDebugEvent, replaceOcrManagers, stopCapture]);

  useEffect(() => {
    if (!isCapturing) return;

    const intervalId = window.setInterval(() => {
      if (replayRunningRef.current) return;
      if (Date.now() - lastReplayAtRef.current < AUTO_REPLAY_INTERVAL_MS) return;

      const state = fsmRef.current.state;
      if (state !== 'idle' && state !== 'coinDetecting') return;
      if (fsmRef.current.coinResult != null || detectedIsFirstRef.current != null) return;

      const diagnostics = ocrRef.current.getDiagnostics();
      const hasRecentMiss =
        diagnostics.lastAttemptAt != null && Date.now() - diagnostics.lastAttemptAt <= 2_500;
      if (!hasRecentMiss) return;

      void replayRecentClip({
        reason: 'auto_backfill',
        lookbackMs: AUTO_REPLAY_LOOKBACK_MS,
      });
    }, AUTO_REPLAY_POLL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [isCapturing, replayRecentClip]);

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
        coinOcrIsFirst: ocrSnapshot?.detectedIsFirst ?? null,
        coinOcrAt: ocrSnapshot?.updatedAt,
        resultOcrText: ocrSnapshot?.detectionText?.slice(0, 120) ?? null,
        resultOcrResult: ocrSnapshot?.detectionResult ?? null,
        resultOcrConfidence: ocrSnapshot?.detectionConfidence ?? null,
        ocrLastSkipReason: ocrDiagnostics.lastSkipReason,
        ocrLastAttemptAt: ocrDiagnostics.lastAttemptAt,
        ocrLastCompletedAt: ocrDiagnostics.lastCompletedAt,
        ocrLastError: ocrDiagnostics.lastError,
        ocrLastRawText: ocrDiagnostics.lastRawText?.slice(0, 120) ?? null,
        ocrLastParsedResult: ocrDiagnostics.lastParsedResult,
        ocrLastParsedConfidence: ocrDiagnostics.lastParsedConfidence,
        ocrLastParsedIsFirst: ocrDiagnostics.lastParsedIsFirst,
        ocrLastParsedDetectionResult: ocrDiagnostics.lastParsedDetectionResult,
        ocrLastParsedDetectionConfidence: ocrDiagnostics.lastParsedDetectionConfidence,
        ocrRoi: ocrDiagnostics.roi,
        resultImageDataUrl: captureRef.current.video
          ? captureVideoRegion(captureRef.current.video, RESULT_ROI)
          : null,
        fullPreviewImageDataUrl: captureRef.current.video
          ? captureVideoPreviewWithRois(captureRef.current.video, [
              { roi: COIN_ROI, color: '#eab308', label: 'coin' },
              { roi: COIN_OCR_SELECTION_ROI, color: '#22c55e', label: 'ocr-select' },
              { roi: COIN_OCR_CONFIRM_ROI, color: '#06b6d4', label: 'ocr-confirm' },
              { roi: COIN_OCR_ROI, color: '#a855f7', label: 'ocr-legacy' },
              { roi: RESULT_TEXT_ROI, color: '#ef4444', label: 'result-text' },
              { roi: RESULT_MESSAGE_OCR_ROI, color: '#facc15', label: 'result-msg' },
              { roi: RESULT_CENTER_ROI, color: '#f97316', label: 'result-center' },
              { roi: RESULT_ROI, color: '#fb7185', label: 'result-legacy' },
            ])
          : null,
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
    detectedIsFirst,
    detectionResult: fsmContext.detectionResult,
    isCapturing,
    autoRegister,
    lastFrame,
  };

  return {
    status,
    startCapture,
    stopCapture,
    resetAnalysis,
    autoRegister,
    setAutoRegister,
  };
}
