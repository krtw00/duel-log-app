export type DetectionResult = 'win' | 'loss' | null;
export type CoinResult = 'won' | 'lost' | null;

export type FSMState =
  | 'idle'
  | 'coinDetecting'
  | 'coinDetected'
  | 'resultDetecting'
  | 'resultDetected'
  | 'cooldown';

export type DetectionEvent = {
  coin: CoinResult;
  coinConfidence: number;
  result: DetectionResult;
  resultConfidence: number;
};

export type FSMContext = {
  state: FSMState;
  coinResult: CoinResult;
  coinStreak: number;
  resultStreak: number;
  detectionResult: DetectionResult;
  coinDetectedAt: number;
  resultDetectedAt: number;
  cooldownUntil: number;
};

export type AnalysisFrame = {
  coin: CoinResult;
  coinConfidence: number;
  result: DetectionResult;
  resultConfidence: number;
  timestamp: number;
};

export type ScreenAnalysisStatus = {
  state: FSMState;
  coinResult: CoinResult;
  detectionResult: DetectionResult;
  isCapturing: boolean;
  autoRegister: boolean;
};

export type ROI = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type ColorTarget = {
  r: number;
  g: number;
  b: number;
  tolerance: number;
};

export type WorkerMessage = { type: 'analyze'; imageData: ImageData } | { type: 'stop' };

export type WorkerResponse = {
  type: 'result';
  data: AnalysisFrame;
};
