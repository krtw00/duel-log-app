/**
 * Web Worker 用のメッセージ型定義
 */

import type { AnalysisResult, CoinResult } from '@/utils/screenAnalysis';

// FPS設定
export interface FpsConfig {
  fps: number;
}

// テンプレートマッチング用Worker メッセージ

export interface TemplateWorkerInitMessage {
  type: 'init';
  config: {
    turnChoice: {
      winTemplateUrl: string;
      loseTemplateUrl: string;
      downscale: number;
      useEdge: boolean;
      blurSigma: number;
      templateBaseWidth: number;
      supportedHeights: number[];
      roi: { x: number; y: number; width: number; height: number };
      threshold: number;
      margin: number;
      stride: number;
      requiredStreak: number;
      cooldownMs: number;
      activeMs: number;
    };
    result: {
      winTemplateUrl: string;
      loseTemplateUrl: string;
      downscale: number;
      useEdge: boolean;
      blurSigma: number;
      templateBaseWidth: number;
      supportedHeights: number[];
      roi: { x: number; y: number; width: number; height: number };
      threshold: number;
      margin: number;
      stride: number;
      requiredStreak: number;
      cooldownMs: number;
    };
  };
}

export interface TemplateWorkerAnalyzeMessage {
  type: 'analyze';
  imageData: ImageData;
  timestamp: number;
}

export interface TemplateWorkerSetFpsMessage {
  type: 'setFps';
  fps: number;
}

export interface TemplateWorkerResetMessage {
  type: 'reset';
}

export type TemplateWorkerMessage =
  | TemplateWorkerInitMessage
  | TemplateWorkerAnalyzeMessage
  | TemplateWorkerSetFpsMessage
  | TemplateWorkerResetMessage;

// テンプレートマッチング用Worker レスポンス

export interface TemplateWorkerInitResponse {
  type: 'init';
  success: boolean;
  error?: string;
  templateStatus?: {
    coinWin: boolean;
    coinLose: boolean;
    win: boolean;
    lose: boolean;
  };
}

export interface TemplateWorkerAnalysisResponse {
  type: 'analysis';
  turnChoiceResult: {
    detected: boolean;
    result: CoinResult | null;
    eventId: number;
    available: boolean;
  };
  matchResult: {
    detected: boolean;
    result: AnalysisResult | null;
    eventId: number;
  };
  scores: {
    coinWin: number;
    coinLose: number;
    win: number;
    lose: number;
  };
  lockState: 'locked' | 'unlocked';
}

export type TemplateWorkerResponse = TemplateWorkerInitResponse | TemplateWorkerAnalysisResponse;

// TensorFlow.js用Worker メッセージ

export interface TfjsWorkerInitMessage {
  type: 'init';
  config: {
    coin: {
      modelUrl: string;
      inputSize: number;
      labels: string[];
      threshold: number;
      roi: { x: number; y: number; width: number; height: number };
    };
    result: {
      modelUrl: string;
      inputSize: number;
      labels: string[];
      threshold: number;
      roi: { x: number; y: number; width: number; height: number };
    };
  };
}

export interface TfjsWorkerAnalyzeMessage {
  type: 'analyze';
  imageData: ImageData;
  timestamp: number;
}

export interface TfjsWorkerSetFpsMessage {
  type: 'setFps';
  fps: number;
}

export interface TfjsWorkerResetMessage {
  type: 'reset';
}

export type TfjsWorkerMessage =
  | TfjsWorkerInitMessage
  | TfjsWorkerAnalyzeMessage
  | TfjsWorkerSetFpsMessage
  | TfjsWorkerResetMessage;

// TensorFlow.js用Worker レスポンス

export interface TfjsWorkerInitResponse {
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

export interface TfjsWorkerAnalysisResponse {
  type: 'analysis';
  coinResult: {
    detected: boolean;
    result: CoinResult | null;
    eventId: number;
    available: boolean;
  };
  matchResult: {
    detected: boolean;
    result: AnalysisResult | null;
    eventId: number;
  };
  scores: {
    coinWin: number;
    coinLose: number;
    win: number;
    lose: number;
  };
  predictedLabels: {
    coin: string;
    result: string;
  };
  lockState: 'locked' | 'unlocked';
}

export type TfjsWorkerResponse = TfjsWorkerInitResponse | TfjsWorkerAnalysisResponse;
