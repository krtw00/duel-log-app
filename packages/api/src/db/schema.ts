import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull().unique(),
  displayName: text('display_name').notNull(),
  isAdmin: boolean('is_admin').notNull().default(false),
  isDebugger: boolean('is_debugger').notNull().default(false),
  themePreference: text('theme_preference').notNull().default('system'),
  streamerMode: boolean('streamer_mode').notNull().default(false),
  enableScreenAnalysis: boolean('enable_screen_analysis').notNull().default(false),
  status: text('status').notNull().default('active'),
  statusReason: text('status_reason'),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const decks = pgTable('decks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  isOpponentDeck: boolean('is_opponent_deck').notNull().default(false),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const duels = pgTable(
  'duels',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    deckId: uuid('deck_id')
      .notNull()
      .references(() => decks.id),
    opponentDeckId: uuid('opponent_deck_id')
      .notNull()
      .references(() => decks.id),
    result: text('result').notNull(),
    gameMode: text('game_mode').notNull(),
    isFirst: boolean('is_first').notNull(),
    wonCoinToss: boolean('won_coin_toss').notNull(),
    rank: integer('rank'),
    rateValue: real('rate_value'),
    dcValue: integer('dc_value'),
    memo: text('memo'),
    dueledAt: timestamp('dueled_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_duels_user_mode_date').on(table.userId, table.gameMode, table.dueledAt),
    index('idx_duels_user_deck_result').on(table.userId, table.deckId, table.result),
    index('idx_duels_matchup').on(table.userId, table.deckId, table.opponentDeckId, table.result),
  ],
);

export const sharedStatistics = pgTable('shared_statistics', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  filters: jsonb('filters').notNull().default({}),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
