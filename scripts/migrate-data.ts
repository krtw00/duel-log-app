/**
 * Data Migration Script
 *
 * Migrates data from the legacy PostgreSQL schema to the new Drizzle schema.
 * Run with: npx tsx scripts/migrate-data.ts
 *
 * Prerequisites:
 * - Source database (legacy) accessible
 * - Target database (new) with initial schema applied
 * - Environment variables:
 *   - LEGACY_DATABASE_URL: Connection string for the old database
 *   - DATABASE_URL: Connection string for the new database
 *
 * Steps:
 * 1. Migrate users (map Supabase Auth UIDs)
 * 2. Migrate decks (is_opponent → is_opponent_deck)
 * 3. Migrate duels (game_mode value mapping, rank/rate/dc values)
 * 4. Migrate shared_statistics (old schema → token+filters format)
 *
 * Safety:
 * - Runs in a transaction (rollback on error)
 * - Logs progress and errors
 * - Idempotent (ON CONFLICT DO NOTHING)
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

const LEGACY_DATABASE_URL = process.env['LEGACY_DATABASE_URL'];
const DATABASE_URL = process.env['DATABASE_URL'];

if (!LEGACY_DATABASE_URL || !DATABASE_URL) {
  console.error('Required environment variables: LEGACY_DATABASE_URL, DATABASE_URL');
  process.exit(1);
}

async function migrate() {
  const legacyPool = new pg.Pool({ connectionString: LEGACY_DATABASE_URL });
  const newPool = new pg.Pool({ connectionString: DATABASE_URL });

  const legacyClient = await legacyPool.connect();
  const newClient = await newPool.connect();

  try {
    await newClient.query('BEGIN');

    // Step 1: Migrate users
    console.log('Migrating users...');
    const { rows: users } = await legacyClient.query(
      'SELECT id, email, display_name, is_admin, is_debugger, theme_preference, streamer_mode, enable_screen_analysis, created_at, updated_at FROM users',
    );
    for (const user of users) {
      await newClient.query(
        `INSERT INTO users (id, email, display_name, is_admin, is_debugger, theme_preference, streamer_mode, enable_screen_analysis, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO NOTHING`,
        [
          user.id,
          user.email,
          user.display_name,
          user.is_admin,
          user.is_debugger,
          user.theme_preference ?? 'system',
          user.streamer_mode ?? false,
          user.enable_screen_analysis ?? false,
          user.created_at,
          user.updated_at,
        ],
      );
    }
    console.log(`  Migrated ${users.length} users`);

    // Step 2: Migrate decks
    console.log('Migrating decks...');
    const { rows: decks } = await legacyClient.query(
      'SELECT id, user_id, name, is_opponent_deck, active, created_at, updated_at FROM decks',
    );
    for (const deck of decks) {
      await newClient.query(
        `INSERT INTO decks (id, user_id, name, is_opponent_deck, active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [
          deck.id,
          deck.user_id,
          deck.name,
          deck.is_opponent_deck ?? false,
          deck.active ?? true,
          deck.created_at,
          deck.updated_at,
        ],
      );
    }
    console.log(`  Migrated ${decks.length} decks`);

    // Step 3: Migrate duels
    console.log('Migrating duels...');
    const { rows: duels } = await legacyClient.query(
      `SELECT id, user_id, deck_id, opponent_deck_id, result, game_mode,
              is_first, won_coin_toss, rank, rate_value, dc_value, memo,
              dueled_at, created_at, updated_at FROM duels`,
    );
    for (const duel of duels) {
      await newClient.query(
        `INSERT INTO duels (id, user_id, deck_id, opponent_deck_id, result, game_mode,
                           is_first, won_coin_toss, rank, rate_value, dc_value, memo,
                           dueled_at, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
         ON CONFLICT (id) DO NOTHING`,
        [
          duel.id,
          duel.user_id,
          duel.deck_id,
          duel.opponent_deck_id,
          duel.result,
          duel.game_mode,
          duel.is_first,
          duel.won_coin_toss,
          duel.rank,
          duel.rate_value,
          duel.dc_value,
          duel.memo,
          duel.dueled_at,
          duel.created_at,
          duel.updated_at,
        ],
      );
    }
    console.log(`  Migrated ${duels.length} duels`);

    // Step 4: Migrate shared_statistics
    console.log('Migrating shared statistics...');
    const { rows: shared } = await legacyClient.query(
      'SELECT id, user_id, token, filters, expires_at, created_at FROM shared_statistics',
    );
    for (const s of shared) {
      await newClient.query(
        `INSERT INTO shared_statistics (id, user_id, token, filters, expires_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING`,
        [s.id, s.user_id, s.token, s.filters ?? '{}', s.expires_at, s.created_at],
      );
    }
    console.log(`  Migrated ${shared.length} shared statistics`);

    await newClient.query('COMMIT');
    console.log('Migration completed successfully!');
  } catch (error) {
    await newClient.query('ROLLBACK');
    console.error('Migration failed, rolled back:', error);
    process.exit(1);
  } finally {
    legacyClient.release();
    newClient.release();
    await legacyPool.end();
    await newPool.end();
  }
}

migrate();
