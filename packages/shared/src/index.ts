// Constants
export { GAME_MODES, RESULTS, THEME_PREFERENCES, USER_STATUSES } from './constants/index.js';
export type { GameMode, Result, ThemePreference, UserStatus } from './constants/index.js';

// Schemas
export { userSchema, updateUserSchema, updateUserStatusSchema } from './schemas/user.js';
export { deckSchema, createDeckSchema, updateDeckSchema } from './schemas/deck.js';
export {
  duelSchema,
  createDuelSchema,
  updateDuelSchema,
  duelFilterSchema,
} from './schemas/duel.js';
export {
  sharedStatisticsSchema,
  createSharedStatisticsSchema,
  sharedStatisticsFilterSchema,
} from './schemas/sharedStatistics.js';
export {
  overviewStatsSchema,
  deckWinRateSchema,
  matchupEntrySchema,
  streaksSchema,
  valueSequenceEntrySchema,
  statisticsFilterSchema,
} from './schemas/statistics.js';
export {
  paginationSchema,
  errorResponseSchema,
  errorDetailSchema,
  singleResponseSchema,
  listResponseSchema,
} from './schemas/api.js';

// Types
export type {
  User,
  UpdateUser,
  UpdateUserStatus,
  Deck,
  CreateDeck,
  UpdateDeck,
  Duel,
  CreateDuel,
  UpdateDuel,
  DuelFilter,
  SharedStatistics,
  CreateSharedStatistics,
  SharedStatisticsFilter,
  OverviewStats,
  DeckWinRate,
  MatchupEntry,
  Streaks,
  ValueSequenceEntry,
  StatisticsFilter,
  Pagination,
  ErrorResponse,
  ErrorDetail,
} from './types/index.js';

// Errors
export { ERROR_CODES, ERROR_STATUS_MAP } from './errors/index.js';
export type { ErrorCode } from './errors/index.js';
