/**
 * 画面解析モジュール
 *
 * FSM、設定、型をエクスポート
 */

// 型
export type {
  CoinResult,
  MatchResult,
  DetectionPhase,
  FSMState,
  FSMConfig,
  DetectionScores,
  DetectionEvent,
  CoinDetectedEvent,
  ResultDetectedEvent,
  RoiRatio,
  WorkerConfig,
  WorkerMessage,
  WorkerResponse,
  WorkerInitMessage,
  WorkerAnalyzeMessage,
  WorkerSetFpsMessage,
  WorkerResetMessage,
  WorkerInitResponse,
  WorkerScoresResponse,
  WorkerErrorResponse,
  WorkerLogResponse,
  WorkerDebugImageResponse,
  ModelStatus,
} from './types';

// 設定
export {
  ROI_CONFIG,
  FSM_CONFIG,
  WORKER_CONFIG,
  ANALYSIS_CONFIG,
} from './config';

// FSM
export { createFSM } from './fsm';
export type { FSM } from './fsm';

// ユーティリティ
export const createCanvas = (width: number, height: number) => {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height);
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
};
