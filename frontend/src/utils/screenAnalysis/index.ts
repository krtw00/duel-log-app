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
  ModelStatus,
} from './types';

// 設定
export {
  MODEL_INPUT_SIZE,
  ROI_CONFIG,
  FSM_CONFIG,
  WORKER_CONFIG,
  ANALYSIS_CONFIG,
  COLOR_HEURISTICS,
} from './config';

// FSM
export { createFSM } from './fsm';
export type { FSM } from './fsm';
