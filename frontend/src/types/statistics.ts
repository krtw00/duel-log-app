/**
 * 統計データ関連の型定義
 */

import type { GameMode, DeckDistribution, MatchupData, TimeSeriesData, Duel } from './index';
import type { PieChartData, LineChartData, ApexPieChartOptions } from './chart';

/**
 * 統計API クエリパラメータ
 */
export interface StatisticsQueryParams {
  year: number;
  month: number;
  range_start?: number;
  range_end?: number;
  my_deck_id?: number | null;
  opponent_deck_id?: number | null;
  game_mode?: GameMode;
}

/**
 * 統計API レスポンス（単一ゲームモード）
 */
export interface StatisticsResponse {
  year: number;
  month: number;
  monthly_deck_distribution: DeckDistribution[];
  recent_deck_distribution: DeckDistribution[];
  matchup_data: MatchupData[];
  time_series_data: TimeSeriesData[];
}

/**
 * 統計API レスポンス（複数ゲームモード）
 */
export interface MultiModeStatisticsResponse {
  RANK?: StatisticsResponse;
  RATE?: StatisticsResponse;
  EVENT?: StatisticsResponse;
  DC?: StatisticsResponse;
}

/**
 * ダッシュボード統計レスポンス（特殊ケース）
 */
export interface DashboardStatisticsResponse {
  year: number;
  month: number;
  duels: Duel[];
  monthly_deck_distribution: DeckDistribution[];
  recent_deck_distribution: DeckDistribution[];
  matchup_data: MatchupData[];
  time_series_data: TimeSeriesData[];
}

/**
 * 処理済み統計データ（フロントエンド用）
 */
export interface ProcessedStatistics {
  year: number;
  month: number;
  monthlyDeckDistribution: PieChartData;
  recentDeckDistribution: PieChartData;
  matchupData: ProcessedMatchupData[];
  timeSeriesData: LineChartData;
}

/**
 * 処理済みマッチアップデータ（テーブル表示用）
 */
export interface ProcessedMatchupData {
  deck_name: string;
  opponent_deck_name: string;
  total_duels: number;
  wins: number;
  win_rate: number;
  win_rate_first: number;
  win_rate_second: number;
}

/**
 * マッチアップテーブルのカラム定義
 */
export interface MatchupTableColumn {
  key: string;
  title: string;
  sortable?: boolean;
  align?: 'start' | 'center' | 'end';
  width?: string;
}

/**
 * 統計セクションの設定
 */
export interface StatisticsSectionConfig {
  title: string;
  icon: string;
  color: string;
  description?: string;
}

/**
 * デッキ分布チャートの設定
 */
export interface DeckDistributionChartConfig {
  title: string;
  chartOptions: ApexPieChartOptions;
  series: number[];
}

/**
 * 時系列チャートの設定
 */
export interface TimeSeriesChartConfig {
  title: string;
  description?: string;
}

/**
 * 統計フィルターの状態
 */
export interface StatisticsFilterState {
  year: number;
  month: number;
  rangeStart: number;
  rangeEnd: number;
  myDeckId: number | null;
  gameMode?: GameMode;
}

/**
 * 共有統計の処理済みデータ（全ゲームモード）
 */
export interface ProcessedSharedStatistics {
  RANK?: ProcessedStatistics;
  RATE?: ProcessedStatistics;
  EVENT?: ProcessedStatistics;
  DC?: ProcessedStatistics;
  DASHBOARD?: DashboardStatisticsResponse;
}
