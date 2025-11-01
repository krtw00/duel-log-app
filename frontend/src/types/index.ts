export interface User {
  id: number;
  username: string;
  email: string;
  streamer_mode: boolean;
  theme_preference: string;
}

export interface UserCreate {
  username: string;
  email: string;
  password: string;
}

export interface Deck {
  id: number;
  name: string;
  is_opponent: boolean;
  active: boolean;
  user_id?: number;
  createdat?: string;
  updatedat?: string;
}

export interface DeckCreate {
  name: string;
  is_opponent: boolean;
  active?: boolean;
}

export interface DeckUpdate {
  name?: string;
  is_opponent?: boolean;
  active?: boolean;
}

export type GameMode = 'RANK' | 'RATE' | 'EVENT' | 'DC';

/**
 * 対戦履歴インターフェース
 *
 * トレーディングカードゲームの対戦結果を表現します。
 * バックエンドのDuelモデルに対応しています。
 */
export interface Duel {
  id: number;
  deck_id: number; // 使用したデッキのID
  opponent_deck_id: number; // 相手のデッキのID
  is_win: boolean; // true=勝利, false=敗北
  game_mode: GameMode; // RANK, RATE, EVENT, DC
  rank?: number; // ランクモード時のランク（1-15: B2～M1）
  rate_value?: number; // レートモード時のレート数値
  dc_value?: number; // DCモード時のDC数値
  won_coin_toss: boolean; // true=コイントス勝利, false=敗北
  is_going_first: boolean; // true=先攻, false=後攻
  played_date: string; // 対戦日時（ISO8101形式）
  notes?: string; // メモ（任意）
  create_date: string; // 作成日時
  update_date: string; // 更新日時
  user_id: number; // ユーザーID
  // フロントエンドで追加するフィールド
  deck?: Deck; // 使用したデッキの詳細情報（結合データ）
  opponent_deck?: Deck; // 相手のデッキの詳細情報（結合データ）
  no?: number; // テーブル表示用の連番
}

export interface DuelCreate {
  deck_id: number | null;
  opponent_deck_id: number | null;
  result: number;
  game_mode: GameMode;
  rank?: number;
  rate_value?: number;
  dc_value?: number;
  coin: number;
  first_or_second: number;
  played_date: string;
  notes?: string;
}

export interface DuelUpdate {
  deck_id?: number;
  opponent_deck_id?: number;
  is_win?: boolean;
  game_mode?: GameMode;
  rank?: number;
  rate_value?: number;
  dc_value?: number;
  won_coin_toss?: boolean;
  is_going_first?: boolean;
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
 * 値シーケンスデータ
 */
export interface ValueSequenceEntry {
  value: number;
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
  value_sequence_data: ValueSequenceEntry[];
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

export interface SharedStatisticsResponse extends SharedStatisticsReadPayload {
  statistics_data: SharedStatisticsData;
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
