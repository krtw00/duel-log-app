import { z } from 'zod';
import { GAME_MODES, RESULTS } from '../constants/index.js';

/** デュエル（全フィールド） */
export const duelSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  deckId: z.string().uuid(),
  opponentDeckId: z.string().uuid(),
  result: z.enum(RESULTS),
  gameMode: z.enum(GAME_MODES),
  isFirst: z.boolean(),
  wonCoinToss: z.boolean(),
  rank: z.number().int().nullable(),
  rateValue: z.number().nullable(),
  dcValue: z.number().int().nullable(),
  memo: z.string().nullable(),
  dueledAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/** デュエル作成 */
export const createDuelSchema = z.object({
  deckId: z.string().uuid(),
  opponentDeckId: z.string().uuid(),
  result: z.enum(RESULTS),
  gameMode: z.enum(GAME_MODES),
  isFirst: z.boolean(),
  wonCoinToss: z.boolean(),
  rank: z.number().int().nullable().optional(),
  rateValue: z.number().nullable().optional(),
  dcValue: z.number().int().nullable().optional(),
  memo: z.string().max(1000).nullable().optional(),
  dueledAt: z.string().datetime(),
});

/** デュエル更新 */
export const updateDuelSchema = z.object({
  deckId: z.string().uuid().optional(),
  opponentDeckId: z.string().uuid().optional(),
  result: z.enum(RESULTS).optional(),
  gameMode: z.enum(GAME_MODES).optional(),
  isFirst: z.boolean().optional(),
  wonCoinToss: z.boolean().optional(),
  rank: z.number().int().nullable().optional(),
  rateValue: z.number().nullable().optional(),
  dcValue: z.number().int().nullable().optional(),
  memo: z.string().max(1000).nullable().optional(),
  dueledAt: z.string().datetime().optional(),
});

/** デュエル一覧フィルタ */
export const duelFilterSchema = z.object({
  gameMode: z.enum(GAME_MODES).optional(),
  deckId: z.string().uuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  fromTimestamp: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
