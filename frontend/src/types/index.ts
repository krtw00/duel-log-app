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

export interface Duel {
  id: number;
  deck_id: number;
  opponentDeck_id: number;
  result: boolean; // true = win, false = lose
  game_mode: GameMode; // RANK, RATE, EVENT, DC
  rank?: number; // ランクモード時のランク（1-15）
  rate_value?: number; // レートモード時のレート数値
  dc_value?: number; // DCモード時のDC数値
  coin: boolean; // true = heads, false = tails
  first_or_second: boolean; // true = first, false = second
  played_date: string;
  notes?: string;
  create_date: string;
  update_date: string;
  user_id: number;
  // フロントエンドで追加するフィールド
  deck?: Deck;
  opponentdeck?: Deck;
}

export interface DuelCreate {
  deck_id: number | null;
  opponentDeck_id: number | null;
  result: boolean;
  game_mode: GameMode;
  rank?: number;
  rate_value?: number;
  dc_value?: number;
  coin: boolean;
  first_or_second: boolean;
  played_date: string;
  notes?: string;
}

export interface DuelUpdate {
  deck_id?: number;
  opponentDeck_id?: number;
  result?: boolean;
  game_mode?: GameMode;
  rank?: number;
  rate_value?: number;
  dc_value?: number;
  coin?: boolean;
  first_or_second?: boolean;
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
