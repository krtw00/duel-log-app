import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import {
  COIN_BAR_ROI,
  COIN_BUTTONS_ROI,
  CONFIDENCE_THRESHOLD,
  RESULT_STREAK_THRESHOLD,
  RESULT_TEXT_ROI,
  SCAN_FPS,
} from '../utils/screenAnalysis/config.js';
import { createInitialContext, transition } from '../utils/screenAnalysis/fsm.js';
import type {
  AnalysisFrame,
  CoinResult,
  DetectionResult,
  FSMContext,
  FSMState,
  ScreenAnalysisStatus,
} from '../utils/screenAnalysis/types.js';

type AutoRegisterCallback = (data: {
  coin: CoinResult;
  isFirst: boolean;
  result: DetectionResult;
}) => void;

type DebugLogEntry = {
  ts: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  event: string;
  state?: FSMState;
  data?: unknown;
};

const DEBUG_LOG_FRAME_INTERVAL_MS = 1000;
const DEBUG_LOG_FLUSH_INTERVAL_MS = 3000;
const DEBUG_LOG_MAX_QUEUE = 500;

export function useScreenAnalysis(onAutoRegister?: AutoRegisterCallback) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [autoRegister, setAutoRegister] = useState(false);
  const [fsmContext, setFsmContext] = useState<FSMContext>(createInitialContext);
  const [debugLoggingEnabled, setDebugLoggingEnabled] = useState(() => {
    return localStorage.getItem('duellog.screenAnalysis.debugLogging') === 'true';
  });
  const [debugSessionId, setDebugSessionId] = useState<string | null>(null);
  const [lastFrame, setLastFrame] = useState<AnalysisFrame | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<OffscreenCanvas | null>(null);
  const intervalRef = useRef<number | null>(null);
  const fsmRef = useRef<FSMContext>(createInitialContext());
  const autoRegisterRef = useRef(autoRegister);
  const debugSessionIdRef = useRef<string | null>(null);
  const debugQueueRef = useRef<DebugLogEntry[]>([]);
  const debugFlushTimerRef = useRef<number | null>(null);
  const lastFrameLogAtRef = useRef(0);
  const prevStateRef = useRef<FSMState>('idle');

  useEffect(() => {
    autoRegisterRef.current = autoRegister;
  }, [autoRegister]);

  useEffect(() => {
    localStorage.setItem('duellog.screenAnalysis.debugLogging', String(debugLoggingEnabled));
  }, [debugLoggingEnabled]);

  const enqueueDebugLog = useCallback(
    (entry: DebugLogEntry) => {
      if (!debugLoggingEnabled) return;
      debugQueueRef.current.push(entry);
      if (debugQueueRef.current.length > DEBUG_LOG_MAX_QUEUE) {
        debugQueueRef.current.splice(0, debugQueueRef.current.length - DEBUG_LOG_MAX_QUEUE);
      }
    },
    [debugLoggingEnabled],
  );

  const flushDebugLogs = useCallback(async () => {
    if (!debugLoggingEnabled) return;
    const sessionId = debugSessionIdRef.current;
    if (!sessionId || debugQueueRef.current.length === 0) return;

    const entries = debugQueueRef.current.splice(0, DEBUG_LOG_MAX_QUEUE);
    try {
      await api('/debug/screen-analysis/logs', {
        method: 'POST',
        body: { sessionId, entries },
      });
    } catch {
      debugQueueRef.current.unshift(...entries);
    }
  }, [debugLoggingEnabled]);

  const startDebugSession = useCallback(
    (data?: Record<string, unknown>) => {
      if (!debugLoggingEnabled) return;
      const sessionId =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : (() => {
              if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
                const bytes = new Uint8Array(16);
                (crypto as Crypto).getRandomValues(bytes);
                const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join(
                  '',
                );
                return `${Date.now()}-${hex}`;
              }
              return `${Date.now()}`;
            })();
      debugSessionIdRef.current = sessionId;
      setDebugSessionId(sessionId);
      enqueueDebugLog({
        ts: new Date().toISOString(),
        level: 'info',
        event: 'session_start',
        data: {
          scanFps: SCAN_FPS,
          confidenceThreshold: CONFIDENCE_THRESHOLD,
          resultStreakThreshold: RESULT_STREAK_THRESHOLD,
          roi: {
            coinBar: COIN_BAR_ROI,
            coinButtons: COIN_BUTTONS_ROI,
            resultText: RESULT_TEXT_ROI,
          },
          ...data,
        },
      });
    },
    [debugLoggingEnabled, enqueueDebugLog],
  );

  useEffect(() => {
    if (!debugLoggingEnabled || !isCapturing) {
      if (debugFlushTimerRef.current) {
        clearInterval(debugFlushTimerRef.current);
        debugFlushTimerRef.current = null;
      }
      return;
    }
    if (!debugFlushTimerRef.current) {
      debugFlushTimerRef.current = window.setInterval(() => {
        void flushDebugLogs();
      }, DEBUG_LOG_FLUSH_INTERVAL_MS);
    }
    return () => {
      if (debugFlushTimerRef.current) {
        clearInterval(debugFlushTimerRef.current);
        debugFlushTimerRef.current = null;
      }
    };
  }, [debugLoggingEnabled, flushDebugLogs, isCapturing]);

  useEffect(() => {
    if (debugLoggingEnabled && isCapturing && !debugSessionIdRef.current) {
      startDebugSession({ reason: 'debug_enabled_mid_capture' });
    }
    if (!debugLoggingEnabled && debugSessionIdRef.current) {
      enqueueDebugLog({
        ts: new Date().toISOString(),
        level: 'info',
        event: 'debug_disabled',
      });
      void flushDebugLogs();
      debugSessionIdRef.current = null;
      setDebugSessionId(null);
    }
  }, [debugLoggingEnabled, enqueueDebugLog, flushDebugLogs, isCapturing, startDebugSession]);

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

  const handleWorkerMessage = useCallback(
    (event: MessageEvent) => {
      if (event.data.type === 'result') {
        const frame: AnalysisFrame = event.data.data;
        setLastFrame(frame);
        const newContext = transition(fsmRef.current, frame);
        fsmRef.current = newContext;
        setFsmContext(newContext);

        if (debugLoggingEnabled && debugSessionIdRef.current) {
          const now = frame.timestamp;
          if (now - lastFrameLogAtRef.current >= DEBUG_LOG_FRAME_INTERVAL_MS) {
            enqueueDebugLog({
              ts: new Date(now).toISOString(),
              level: 'debug',
              event: 'frame',
              state: newContext.state,
              data: {
                coin: frame.coin,
                coinConfidence: frame.coinConfidence,
                result: frame.result,
                resultConfidence: frame.resultConfidence,
                debug: frame.debug,
              },
            });
            lastFrameLogAtRef.current = now;
          }

          if (prevStateRef.current !== newContext.state) {
            enqueueDebugLog({
              ts: new Date(now).toISOString(),
              level: 'info',
              event: 'state_transition',
              state: newContext.state,
              data: { from: prevStateRef.current, to: newContext.state },
            });
            prevStateRef.current = newContext.state;
          }
        } else {
          prevStateRef.current = newContext.state;
        }
      }
    },
    [debugLoggingEnabled, enqueueDebugLog],
  );

  const stopCapture = useCallback(() => {
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
    canvasRef.current = null;
    fsmRef.current = createInitialContext();
    setFsmContext(createInitialContext());
    setIsCapturing(false);

    if (debugLoggingEnabled && debugSessionIdRef.current) {
      enqueueDebugLog({
        ts: new Date().toISOString(),
        level: 'info',
        event: 'capture_stop',
      });
      void flushDebugLogs();
      debugSessionIdRef.current = null;
      setDebugSessionId(null);
    }
  }, [debugLoggingEnabled, enqueueDebugLog, flushDebugLogs]);

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

      // Start scanning interval
      const scanInterval = 1000 / SCAN_FPS;
      intervalRef.current = window.setInterval(() => {
        if (!videoRef.current || !canvasRef.current || !workerRef.current) return;

        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
        workerRef.current.postMessage({ type: 'analyze', imageData }, [imageData.data.buffer]);
      }, scanInterval);

      setIsCapturing(true);

      if (debugLoggingEnabled) {
        startDebugSession({
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          userAgent: navigator.userAgent,
        });
      }

      // Handle stream end (user clicks "Stop Sharing")
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.addEventListener('ended', () => {
          stopCapture();
        });
      }
    } catch (error) {
      enqueueDebugLog({
        ts: new Date().toISOString(),
        level: 'error',
        event: 'capture_error',
        data: { message: error instanceof Error ? error.message : String(error) },
      });
      // User cancelled or not supported
    }
  }, [debugLoggingEnabled, enqueueDebugLog, handleWorkerMessage, startDebugSession, stopCapture]);

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
  };

  return {
    status,
    startCapture,
    stopCapture,
    autoRegister,
    setAutoRegister,
    debugLoggingEnabled,
    setDebugLoggingEnabled,
    debugSessionId,
    lastFrame,
  };
}
