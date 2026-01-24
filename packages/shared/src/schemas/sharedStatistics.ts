import { z } from 'zod';
import { GAME_MODES } from '../constants/index.js';

/** 共有統計フィルター */
export const sharedStatisticsFilterSchema = z.object({
  gameMode: z.enum(GAME_MODES).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  deckId: z.string().uuid().optional(),
});

/** 共有統計（全フィールド） */
export const sharedStatisticsSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  token: z.string(),
  filters: sharedStatisticsFilterSchema,
  expiresAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});

/** 共有統計作成 */
export const createSharedStatisticsSchema = z.object({
  filters: sharedStatisticsFilterSchema,
  expiresAt: z.string().datetime().nullable().optional(),
});
