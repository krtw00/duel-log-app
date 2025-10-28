/**
 * ユーザー情報
 */
export interface User {
  id: number;
  username: string; // ユーザー名
  email: string; // メールアドレス
  streamer_mode: boolean; // 配信者モード（個人情報をマスクする）
  theme_preference: string; // テーマ設定（'light' | 'dark' | 'system'）
}

/**
 * ユーザー作成リクエスト
 */
export interface UserCreate {
  username: string;
  email: string;
  password: string;
}

/**
 * デッキ情報
 *
 * プレイヤーが使用するデッキと相手のデッキを管理します。
 * is_opponentフラグで区別します。
 */
export interface Deck {
  id: number;
  name: string; // デッキ名（例: 'ライゼル', 'バジリス'）
  is_opponent: boolean; // false = プレイヤーのデッキ, true = 相手のデッキ
  active: boolean; // true = 有効, false = 無効（削除済み）
  user_id?: number; // デッキの所有者ID
  createdat?: string; // 作成日時
  updatedat?: string; // 更新日時
}

/**
 * デッキ作成リクエスト
 */
export interface DeckCreate {
  name: string;
  is_opponent: boolean;
  active?: boolean;
}

/**
 * デッキ更新リクエスト
 */
export interface DeckUpdate {
  name?: string;
  is_opponent?: boolean;
  active?: boolean;
}

/**
 * ゲームモード
 * - RANK: ランクマッチ
 * - RATE: レートマッチ
 * - EVENT: イベント戦
 * - DC: DCマッチ
 */
export type GameMode = 'RANK' | 'RATE' | 'EVENT' | 'DC';

/**
 * 対戦記録
 *
 * 1回の対戦（デュエル）に関する情報を記録します。
 */
export interface Duel {
  id: number;
  deck_id: number; // 使用したプレイヤーのデッキID
  opponentDeckId: number; // 相手のデッキID
  isWin: boolean; // 勝敗: true = 勝ち, false = 負け
  game_mode: GameMode; // ゲームモード
  rank?: number; // ランクモード時のランク（1-15: B2～M1）
  rate_value?: number; // レートモード時のレート数値
  dc_value?: number; // DCモード時のDC数値
  wonCoinToss: boolean; // コイントス結果: true = 勝ち, false = 負け
  isGoingFirst: boolean; // ターン順: true = 先攻, false = 後攻
  played_date: string; // 対戦日時（ISO 8601形式）
  notes?: string; // メモ（任意）
  create_date: string; // 作成日時
  update_date: string; // 更新日時
  user_id: number; // 対戦したユーザーID
  // フロントエンドで追加するフィールド
  deck?: Deck; // プレイヤーのデッキ情報（JOIN結果）
  opponentdeck?: Deck; // 相手のデッキ情報（JOIN結果）
  no?: number; // テーブル表示用の連番
}

export interface DuelCreate {
  deck_id: number | null;
  opponentDeckId: number | null;
  isWin: boolean;
  game_mode: GameMode;
  rank?: number;
  rate_value?: number;
  dc_value?: number;
  wonCoinToss: boolean;
  isGoingFirst: boolean;
  played_date: string;
  notes?: string;
}

export interface DuelUpdate {
  deck_id?: number;
  opponentDeckId?: number;
  isWin?: boolean;
  game_mode?: GameMode;
  rank?: number;
  rate_value?: number;
  dc_value?: number;
  wonCoinToss?: boolean;
  isGoingFirst?: boolean;
  played_date?: string;
  notes?: string;
}

export interface DuelStats {
  total_duels: number;
  win_count: number;
  lose_count: number;
  win_rate: number;
  first_turn_win_rate: number;
  second_turn_win_rate: number;
  coin_win_rate: number;
  go_first_rate: number;
}

export interface GameModeStats {
  RANK: DuelStats;
  RATE: DuelStats;
  EVENT: DuelStats;
  DC: DuelStats;
}

/**
 * デッキ分布データ
 */
export interface DeckDistribution {
  deck_name: string;
  count: number;
}

/**
 * マッチアップデータ
 */
export interface MatchupData {
  deck_name: string;
  opponent_deck_name: string;
  total_duels: number;
  wins: number;
  win_rate: number;
  win_rate_first: number;
  win_rate_second: number;
}

/**
 * 時系列データ
 */
export interface TimeSeriesData {
  date: string;
  win_rate: number;
  total_duels: number;
}

/**
 * ゲームモード別の共有統計データ
 */
export interface GameModeStatisticsData {
  year: number;
  month: number;
  monthly_deck_distribution: DeckDistribution[];
  recent_deck_distribution: DeckDistribution[];
  matchup_data: MatchupData[];
  time_series_data: TimeSeriesData[];
}

/**
 * 共有統計データ（全ゲームモード）
 */
export interface SharedStatisticsData {
  [gameMode: string]: GameModeStatisticsData;
}

/**
 * 共有統計作成ペイロード
 */
export interface SharedStatisticsCreatePayload {
  year: number;
  month: number;
  game_mode: GameMode;
  expires_at?: string; // ISO string
}

/**
 * 共有統計読み取りペイロード
 */
export interface SharedStatisticsReadPayload {
  id: number;
  share_id: string;
  user_id: number;
  year: number;
  month: number;
  game_mode: GameMode;
  created_at: string;
  expires_at: string | null;
}

/**
 * OBS表示アイテム
 */
export interface DisplayItem {
  key: string;
  label: string;
  enabled: boolean;
}

/**
 * OBSオーバーレイ統計データ
 */
export interface OBSOverlayStats {
  current_deck?: string;
  current_rank?: string;
  total_duels: number;
  win_rate: number;
  first_turn_win_rate?: number;
  second_turn_win_rate?: number;
  coin_win_rate?: number;
  go_first_rate?: number;
}
