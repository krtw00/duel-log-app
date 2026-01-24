import { z } from 'zod';
import { GAME_MODES } from '../constants/index.js';

/** 統計フィルタ（共通） */
export const statisticsFilterSchema = z.object({
  gameMode: z.enum(GAME_MODES).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  fromTimestamp: z.string().datetime().optional(),
  deckId: z.string().uuid().optional(),
  rangeStart: z.coerce.number().int().min(1).optional(),
  rangeEnd: z.coerce.number().int().min(1).optional(),
});

/** 概要統計レスポンス */
export const overviewStatsSchema = z.object({
  totalDuels: z.number().int(),
  wins: z.number().int(),
  losses: z.number().int(),
  winRate: z.number(),
  firstRate: z.number(),
  firstWinRate: z.number(),
  secondWinRate: z.number(),
  coinTossWinRate: z.number(),
});

/** デッキ別勝率 */
export const deckWinRateSchema = z.object({
  deckId: z.string().uuid(),
  deckName: z.string(),
  totalDuels: z.number().int(),
  wins: z.number().int(),
  losses: z.number().int(),
  winRate: z.number(),
});

/** 相性表エントリ */
export const matchupEntrySchema = z.object({
  deckId: z.string().uuid(),
  deckName: z.string(),
  opponentDeckId: z.string().uuid(),
  opponentDeckName: z.string(),
  opponentDeckIsGeneric: z.boolean(),
  wins: z.number().int(),
  losses: z.number().int(),
  winRate: z.number(),
  firstWinRate: z.number(),
  secondWinRate: z.number(),
});

/** 連勝/連敗レスポンス */
export const streaksSchema = z.object({
  currentStreak: z.number().int(),
  currentStreakType: z.enum(['win', 'loss']).nullable(),
  longestWinStreak: z.number().int(),
  longestLossStreak: z.number().int(),
});

/** ランク/レート推移エントリ */
export const valueSequenceEntrySchema = z.object({
  duelId: z.string().uuid(),
  value: z.number().nullable(),
  dueledAt: z.string().datetime(),
});
