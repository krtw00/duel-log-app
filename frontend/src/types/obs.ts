/**
 * OBS オーバーレイ関連の型定義
 */

import type { GameMode, OBSOverlayStats } from './index';

/**
 * OBS API クエリパラメータ
 */
export interface OBSQueryParams {
  token: string;
  period_type: 'monthly' | 'recent' | 'from_start';
  year?: number;
  month?: number;
  limit?: number;
  game_mode?: GameMode;
  start_id?: number;
  display_items?: string;
  refresh?: number;
  layout?: 'grid' | 'horizontal' | 'vertical';
}

/**
 * OBS 統計レスポンス
 */
export interface OBSStatsResponse extends OBSOverlayStats {
  current_deck?: string;
  current_rank?: string;
  current_rate?: number;
  current_dc?: number;
  total_duels: number;
  win_rate: number;
  first_turn_win_rate?: number;
  second_turn_win_rate?: number;
  coin_win_rate?: number;
  go_first_rate?: number;
}

/**
 * OBS 表示アイテムのフォーマッター関数型
 */
export type OBSDisplayItemFormatter = (value: string | number | undefined) => string;

/**
 * OBS 表示アイテムの定義
 */
export interface OBSDisplayItemDefinition {
  key: keyof OBSStatsResponse;
  label: string;
  format: OBSDisplayItemFormatter;
}

/**
 * OBS レイアウト設定
 */
export interface OBSLayoutConfig {
  layout: 'grid' | 'horizontal' | 'vertical';
  gridColumns?: number;
  itemSpacing?: number;
}

/**
 * OBS 設定
 */
export interface OBSConfiguration {
  periodType: 'monthly' | 'recent' | 'from_start';
  year: number;
  month: number;
  limit: number;
  gameMode?: GameMode;
  layout: 'grid' | 'horizontal' | 'vertical';
  refreshInterval: number;
  displayItems: Array<{
    value: keyof OBSStatsResponse;
    label: string;
    selected: boolean;
  }>;
}

/**
 * OBS URL生成パラメータ
 */
export interface OBSUrlParams {
  token: string;
  period_type: 'monthly' | 'recent' | 'from_start';
  year?: number;
  month?: number;
  limit?: number;
  game_mode?: GameMode;
  start_id?: number;
  display_items: string;
  layout: 'grid' | 'horizontal' | 'vertical';
  refresh: number;
}
