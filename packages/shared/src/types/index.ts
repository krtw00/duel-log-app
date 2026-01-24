import type { z } from 'zod';
import type { errorDetailSchema, errorResponseSchema, paginationSchema } from '../schemas/api.js';
import type { createDeckSchema, deckSchema, updateDeckSchema } from '../schemas/deck.js';
import type {
  createDuelSchema,
  duelFilterSchema,
  duelSchema,
  updateDuelSchema,
} from '../schemas/duel.js';
import type {
  createSharedStatisticsSchema,
  sharedStatisticsFilterSchema,
  sharedStatisticsSchema,
} from '../schemas/sharedStatistics.js';
import type {
  deckWinRateSchema,
  matchupEntrySchema,
  overviewStatsSchema,
  statisticsFilterSchema,
  streaksSchema,
  valueSequenceEntrySchema,
} from '../schemas/statistics.js';
import type { updateUserSchema, updateUserStatusSchema, userSchema } from '../schemas/user.js';

// User
export type User = z.infer<typeof userSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type UpdateUserStatus = z.infer<typeof updateUserStatusSchema>;

// Deck
export type Deck = z.infer<typeof deckSchema>;
export type CreateDeck = z.infer<typeof createDeckSchema>;
export type UpdateDeck = z.infer<typeof updateDeckSchema>;

// Duel
export type Duel = z.infer<typeof duelSchema>;
export type CreateDuel = z.infer<typeof createDuelSchema>;
export type UpdateDuel = z.infer<typeof updateDuelSchema>;
export type DuelFilter = z.infer<typeof duelFilterSchema>;

// SharedStatistics
export type SharedStatistics = z.infer<typeof sharedStatisticsSchema>;
export type CreateSharedStatistics = z.infer<typeof createSharedStatisticsSchema>;
export type SharedStatisticsFilter = z.infer<typeof sharedStatisticsFilterSchema>;

// Statistics
export type OverviewStats = z.infer<typeof overviewStatsSchema>;
export type DeckWinRate = z.infer<typeof deckWinRateSchema>;
export type MatchupEntry = z.infer<typeof matchupEntrySchema>;
export type Streaks = z.infer<typeof streaksSchema>;
export type ValueSequenceEntry = z.infer<typeof valueSequenceEntrySchema>;
export type StatisticsFilter = z.infer<typeof statisticsFilterSchema>;

// API
export type Pagination = z.infer<typeof paginationSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
export type ErrorDetail = z.infer<typeof errorDetailSchema>;
