/**
 * 画面解析 統合設定
 *
 * FSM、Worker、ROIの設定を一元管理
 */

import type { FSMConfig, WorkerConfig, RoiRatio } from './types';

// ROI設定
export const ROI_CONFIG = {
  coin: {
    // 「先攻・後攻を選択してください」テキストを検出
    // 画面中央下部（テキスト領域）
    x: 0.25,
    y: 0.62,
    width: 0.50,
    height: 0.10,
  } as RoiRatio,
  result: {
    x: 0.0,
    y: 0.3,
    width: 1.0,
    height: 0.6, // 王冠アイコン（画面下部）を含むように拡張
  } as RoiRatio,
};

// FSM設定
export const FSM_CONFIG: FSMConfig = {
  coin: {
    threshold: 0.6,
    requiredStreak: 2, // 高速化（約250msで判定）
    cooldownMs: 15000,
    activeMs: 20000,
  },
  result: {
    threshold: 0.6,
    requiredStreak: 2, // 高速化（約250msで判定）
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
    roi: ROI_CONFIG.coin,
  },
  result: {
    roi: ROI_CONFIG.result,
  },
};

// 解析設定
export const ANALYSIS_CONFIG = {
  scanFps: 8, // 125msごとにスキャン
  normalizedWidth: 1280,
};
