/**
 * 画面解析FSM 型定義
 *
 * FSM（有限状態機械）の状態、イベント、設定の型を定義
 */

// 検出対象の結果
export type CoinResult = 'win' | 'lose';
export type MatchResult = 'win' | 'lose';

// FSM状態フェーズ
export type DetectionPhase =
  | 'idle' // 待機中
  | 'coinDetecting' // コイントス検出中
  | 'coinDetected' // コイントス検出済み
  | 'coinCooldown' // コイントスクールダウン中
  | 'resultDetecting' // 勝敗検出中
  | 'resultDetected' // 勝敗検出済み
  | 'resultCooldown'; // 勝敗クールダウン中

// FSM状態
export interface FSMState {
  phase: DetectionPhase;

  // コイントス検出
  coinStreak: number;
  coinCandidate: CoinResult | null;
  coinActiveUntil: number;
  coinCooldownUntil: number;

  // 勝敗検出
  resultStreak: number;
  resultCandidate: MatchResult | null;
  resultCooldownUntil: number;
  resultLocked: boolean;

  // イベントID（UI連携用）
  coinEventId: number;
  resultEventId: number;

  // エラー状態
  lastError: string | null;
}

// Workerから返されるスコア
export interface DetectionScores {
  coinWin: number;
  coinLose: number;
  resultWin: number;
  resultLose: number;
  coinLabel: string;
  resultLabel: string;
  timestamp: number;
}

// FSM設定
export interface FSMConfig {
  coin: {
    threshold: number;
    requiredStreak: number;
    cooldownMs: number;
    activeMs: number;
  };
  result: {
    threshold: number;
    requiredStreak: number;
    cooldownMs: number;
  };
  streak: {
    decayOnLowScore: number;
    decayOnCandidateChange: number;
    increment: number;
  };
}

// 検出イベント
export interface CoinDetectedEvent {
  type: 'coinDetected';
  result: CoinResult;
  eventId: number;
  timestamp: number;
}

export interface ResultDetectedEvent {
  type: 'resultDetected';
  result: MatchResult;
  eventId: number;
  timestamp: number;
}

export type DetectionEvent = CoinDetectedEvent | ResultDetectedEvent;

// ROI（Region of Interest）比率
export interface RoiRatio {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Worker設定
export interface WorkerConfig {
  coin: {
    modelUrl: string;
    inputSize: number;
    labels: string[];
    threshold: number;
    roi: RoiRatio;
  };
  result: {
    modelUrl: string;
    inputSize: number;
    labels: string[];
    threshold: number;
    roi: RoiRatio;
  };
}

// Workerメッセージ型（メインスレッド → Worker）
export interface WorkerInitMessage {
  type: 'init';
  config: WorkerConfig;
}

export interface WorkerAnalyzeMessage {
  type: 'analyze';
  imageData: ImageData;
  timestamp: number;
}

export interface WorkerSetFpsMessage {
  type: 'setFps';
  fps: number;
}

export interface WorkerResetMessage {
  type: 'reset';
}

export type WorkerMessage =
  | WorkerInitMessage
  | WorkerAnalyzeMessage
  | WorkerSetFpsMessage
  | WorkerResetMessage;

// Workerレスポンス型（Worker → メインスレッド）
export interface WorkerInitResponse {
  type: 'init';
  success: boolean;
  error?: string;
  modelStatus?: {
    tfjsReady: boolean;
    coinModelLoaded: boolean;
    resultModelLoaded: boolean;
    usingFallback: boolean;
  };
}

export interface WorkerScoresResponse {
  type: 'scores';
  scores: DetectionScores;
}

export interface WorkerErrorResponse {
  type: 'error';
  error: string;
  timestamp: number;
}

export type WorkerResponse = WorkerInitResponse | WorkerScoresResponse | WorkerErrorResponse;

// モデルステータス
export interface ModelStatus {
  tfjsReady: boolean;
  coinModelLoaded: boolean;
  resultModelLoaded: boolean;
  usingFallback: boolean;
}
