/**
 * ゲームモード関連ユーティリティ
 * ゲームモードのラベル、アイコン、色などを一元管理
 */

import type { GameMode } from '../types';

/** ゲームモード設定 */
export interface GameModeConfig {
  /** ゲームモードの値 */
  value: GameMode;
  /** 日本語ラベル */
  label: string;
  /** Vuetifyアイコン名 */
  icon: string;
  /** Vuetifyカラー名 */
  color: string;
  /** 値フィールドがあるか（RANK, RATE, DCのみ） */
  hasValueField: boolean;
  /** 値フィールドの日本語ラベル */
  valueLabel?: string;
}

/** ゲームモード設定のマップ */
export const GAME_MODE_CONFIG: Record<GameMode, GameModeConfig> = {
  RANK: {
    value: 'RANK',
    label: 'ランク',
    icon: 'mdi-crown',
    color: 'primary',
    hasValueField: true,
    valueLabel: 'ランク',
  },
  RATE: {
    value: 'RATE',
    label: 'レート',
    icon: 'mdi-chart-line',
    color: 'info',
    hasValueField: true,
    valueLabel: 'レート',
  },
  EVENT: {
    value: 'EVENT',
    label: 'イベント',
    icon: 'mdi-calendar-star',
    color: 'secondary',
    hasValueField: false,
  },
  DC: {
    value: 'DC',
    label: 'DC',
    icon: 'mdi-trophy-variant',
    color: 'warning',
    hasValueField: true,
    valueLabel: 'DC',
  },
};

/** ゲームモードの配列（順序保証） */
export const GAME_MODES_LIST: GameMode[] = ['RANK', 'RATE', 'EVENT', 'DC'];

/** セレクトボックス用オプション配列 */
export const GAME_MODE_OPTIONS = GAME_MODES_LIST.map((mode) => ({
  title: GAME_MODE_CONFIG[mode].label,
  value: mode,
}));

/**
 * ゲームモードのラベルを取得
 */
export const getGameModeLabel = (mode: GameMode): string => {
  return GAME_MODE_CONFIG[mode]?.label ?? mode;
};

/**
 * ゲームモードのアイコンを取得
 */
export const getGameModeIcon = (mode: GameMode): string => {
  return GAME_MODE_CONFIG[mode]?.icon ?? 'mdi-help';
};

/**
 * ゲームモードの色を取得
 */
export const getGameModeColor = (mode: GameMode): string => {
  return GAME_MODE_CONFIG[mode]?.color ?? 'grey';
};

/**
 * ゲームモードが値フィールドを持つかどうか
 */
export const gameModeHasValueField = (mode: GameMode): boolean => {
  return GAME_MODE_CONFIG[mode]?.hasValueField ?? false;
};

/**
 * 値を持つゲームモード一覧
 */
export const VALUE_GAME_MODES: GameMode[] = GAME_MODES_LIST.filter(
  (mode) => GAME_MODE_CONFIG[mode].hasValueField,
);

/**
 * ゲームモードが有効な値かチェック
 */
export const isValidGameMode = (value: unknown): value is GameMode => {
  return typeof value === 'string' && GAME_MODES_LIST.includes(value as GameMode);
};

/**
 * ゲームモードごとの統計データを取得するヘルパー
 * Record<GameMode, T>からcurrentModeに対応する値を取得
 */
export const getValueByGameMode = <T>(
  data: Record<GameMode, T>,
  mode: GameMode,
): T => {
  return data[mode];
};

/**
 * 全ゲームモードに対してコールバックを実行
 */
export const forEachGameMode = <T>(
  callback: (mode: GameMode, config: GameModeConfig) => T,
): T[] => {
  return GAME_MODES_LIST.map((mode) => callback(mode, GAME_MODE_CONFIG[mode]));
};
