/**
 * アプリケーション全体で使用する定数定義
 */

/**
 * デュエルフォームのデフォルト値
 */
export const DUEL_DEFAULTS = {
  /** デフォルトランク: プラチナ5 */
  RANK: 18,
  /** デフォルトレート値 */
  RATE: 1500,
  /** デフォルトDC値 */
  DC: 0,
} as const;

/**
 * フィルター期間タイプ
 */
export const FILTER_PERIOD_TYPES = {
  ALL: 'all',
  RANGE: 'range',
  MONTHLY: 'monthly',
} as const;

/**
 * OBS表示項目のデフォルト設定
 */
export const DEFAULT_DISPLAY_ITEMS = [
  { key: 'current_deck', label: '使用デッキ', enabled: true },
  { key: 'current_rank', label: '現在ランク', enabled: false },
  { key: 'total_duels', label: '総デュエル数', enabled: true },
  { key: 'win_rate', label: '勝率', enabled: true },
  { key: 'first_turn_win_rate', label: '先攻勝率', enabled: false },
  { key: 'second_turn_win_rate', label: '後攻勝率', enabled: false },
  { key: 'coin_win_rate', label: 'コイントス勝率', enabled: false },
  { key: 'go_first_rate', label: '先攻率', enabled: false },
] as const;

/**
 * OBSで許可される期間タイプ
 */
export const OBS_ALLOWED_PERIOD_TYPES = ['monthly', 'recent'] as const;

/**
 * 統計表示のデフォルト範囲
 */
export const STATS_DEFAULTS = {
  /** デフォルトの直近N戦の開始値 */
  RANGE_START: 1,
  /** デフォルトの直近N戦の終了値 */
  RANGE_END: 30,
} as const;

/**
 * カラーテーマ
 */
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
} as const;

/**
 * ゲームモード
 */
export const GAME_MODES = {
  RANK: 'RANK',
  RATE: 'RATE',
  EVENT: 'EVENT',
  DC: 'DC',
} as const;

/**
 * CSVエクスポート/インポート設定
 */
export const CSV_CONFIG = {
  /** CSVファイルのデフォルトファイル名 */
  DEFAULT_FILENAME: 'duels.csv',
  /** CSVの文字コード */
  ENCODING: 'utf-8-sig',
} as const;

/**
 * 勝率の色分けしきい値
 */
export const WIN_RATE_THRESHOLDS = {
  /** 優秀な勝率のしきい値 (60%以上) */
  EXCELLENT: 0.6,
  /** 良好な勝率のしきい値 (55%以上) */
  GOOD: 0.55,
  /** 普通の勝率のしきい値 (50%以上) */
  AVERAGE: 0.5,
} as const;

/**
 * コイントス勝率の色分けしきい値
 */
export const COIN_WIN_RATE_THRESHOLDS = {
  /** 高いコイントス勝率のしきい値 (52%以上) */
  HIGH: 0.52,
  /** 普通のコイントス勝率のしきい値 (48%以上) */
  AVERAGE: 0.48,
} as const;

/**
 * API関連定数
 */
export const API_CONFIG = {
  /** デフォルトのタイムアウト時間 (ミリ秒) */
  DEFAULT_TIMEOUT: 30000,
  /** リトライ回数 */
  RETRY_COUNT: 3,
} as const;
