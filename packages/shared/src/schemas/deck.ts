import { z } from 'zod';

/** デッキ（全フィールド） */
export const deckSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string(),
  isOpponentDeck: z.boolean(),
  isGeneric: z.boolean(),
  active: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/** デッキ作成 */
export const createDeckSchema = z.object({
  name: z.string().min(1).max(100),
  isOpponentDeck: z.boolean().default(false),
});

/** デッキ更新 */
export const updateDeckSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});
