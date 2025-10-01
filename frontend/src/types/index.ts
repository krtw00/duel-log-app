export interface User {
  id: number
  username: string
  email: string
}

export interface UserCreate {
  username: string
  email: string
  password: string
}

export interface Deck {
  id: number
  name: string
  is_opponent: boolean
  user_id?: number
  createdat?: string
  updatedat?: string
}

export interface DeckCreate {
  name: string
  is_opponent: boolean
}

export interface DeckUpdate {
  name?: string
  is_opponent?: boolean
}

export interface Duel {
  id: number
  deck_id: number
  opponentDeck_id: number
  result: boolean  // true = win, false = lose
  rank?: number
  coin: boolean  // true = heads, false = tails
  first_or_second: boolean  // true = first, false = second
  played_date: string
  notes?: string
  create_date: string
  update_date: string
  user_id: number
  // フロントエンドで追加するフィールド
  deck?: Deck
  opponentdeck?: Deck
}

export interface DuelCreate {
  deck_id: number
  opponentdeck_id?: number | null
  result: 'win' | 'lose'
  coin: 'heads' | 'tails'
  turn_order: 'first' | 'second'
  rank?: string
  rating?: number
  notes?: string
  played_at?: string
}

export interface DuelStats {
  total_duels: number
  win_count: number
  lose_count: number
  win_rate: number
  first_turn_win_rate: number
  second_turn_win_rate: number
  coin_win_rate: number
  go_first_rate: number
}
