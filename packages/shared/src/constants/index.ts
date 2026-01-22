/** ゲームモード */
export const GAME_MODES = ['RANK', 'RATE', 'EVENT', 'DC'] as const;
export type GameMode = (typeof GAME_MODES)[number];

/** 対戦結果 */
export const RESULTS = ['win', 'loss'] as const;
export type Result = (typeof RESULTS)[number];

/** テーマ設定 */
export const THEME_PREFERENCES = ['light', 'dark', 'system'] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];

/** ユーザーステータス */
export const USER_STATUSES = ['active', 'banned', 'suspended'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];
