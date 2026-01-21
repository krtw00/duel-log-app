/**
 * 画面解析 統合設定
 *
 * FSM、Worker、ML分類の設定を一元管理
 */

import type { FSMConfig, WorkerConfig, RoiRatio } from './types';

// モデル入力サイズ（MobileNet標準）
export const MODEL_INPUT_SIZE = 224;

// 公開URLの解決
const resolvePublicUrl = (path: string): string => {
  const base = typeof import.meta !== 'undefined' ? import.meta.env.BASE_URL || '/' : '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  return `${normalizedBase}${normalizedPath}`;
};

// ROI設定
export const ROI_CONFIG = {
  coin: {
    x: 0.28,
    y: 0.58,
    width: 0.44,
    height: 0.12,
  } as RoiRatio,
  result: {
    x: 0.05,
    y: 0.2,
    width: 0.9,
    height: 0.4,
  } as RoiRatio,
};

// FSM設定
export const FSM_CONFIG: FSMConfig = {
  coin: {
    threshold: 0.6,
    requiredStreak: 5,
    cooldownMs: 15000,
    activeMs: 20000,
  },
  result: {
    threshold: 0.6,
    requiredStreak: 3,
    cooldownMs: 12000,
  },
  streak: {
    decayOnLowScore: 0.5,
    decayOnCandidateChange: 1.5,
    increment: 1.0,
  },
};

// Worker設定
export const WORKER_CONFIG: WorkerConfig = {
  coin: {
    modelUrl: resolvePublicUrl('models/coin-classifier/model.json'),
    inputSize: MODEL_INPUT_SIZE,
    labels: ['lose', 'none', 'win'], // アルファベット順（学習時の順序）
    threshold: FSM_CONFIG.coin.threshold,
    roi: ROI_CONFIG.coin,
  },
  result: {
    modelUrl: resolvePublicUrl('models/result-classifier/model.json'),
    inputSize: MODEL_INPUT_SIZE,
    labels: ['lose', 'none', 'victory'], // アルファベット順（学習時の順序）
    threshold: FSM_CONFIG.result.threshold,
    roi: ROI_CONFIG.result,
  },
};

// 解析設定
export const ANALYSIS_CONFIG = {
  scanFps: 5,
  normalizedWidth: 1280,
};

// 色ヒューリスティック（MLモデルなし時のフォールバック）
export const COLOR_HEURISTICS = {
  coin: {
    win: { rgb: [255, 215, 0] as [number, number, number], tolerance: 80 },
    lose: { rgb: [192, 192, 192] as [number, number, number], tolerance: 80 },
  },
  result: {
    victory: { rgb: [255, 200, 50] as [number, number, number], tolerance: 100 },
    lose: { rgb: [100, 100, 180] as [number, number, number], tolerance: 100 },
  },
};
