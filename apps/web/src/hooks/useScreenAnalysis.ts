import { useCallback, useEffect, useRef, useState } from 'react';
import { SCAN_FPS } from '../utils/screenAnalysis/config.js';
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

export function useScreenAnalysis(onAutoRegister?: AutoRegisterCallback) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [autoRegister, setAutoRegister] = useState(false);
  const [fsmContext, setFsmContext] = useState<FSMContext>(createInitialContext);

  const workerRef = useRef<Worker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<OffscreenCanvas | null>(null);
  const intervalRef = useRef<number | null>(null);
  const fsmRef = useRef<FSMContext>(createInitialContext());
  const autoRegisterRef = useRef(autoRegister);

  useEffect(() => {
    autoRegisterRef.current = autoRegister;
  }, [autoRegister]);

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
  }, [fsmContext.state, fsmContext.coinResult, fsmContext.detectionResult, onAutoRegister]);

  const handleWorkerMessage = useCallback((event: MessageEvent) => {
    if (event.data.type === 'result') {
      const frame: AnalysisFrame = event.data.data;
      const newContext = transition(fsmRef.current, frame);
      fsmRef.current = newContext;
      setFsmContext(newContext);
    }
  }, []);

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
  }, [handleWorkerMessage]);

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
      streamRef.current.getTracks().forEach((track) => track.stop());
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
  }, []);

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
  };
}
