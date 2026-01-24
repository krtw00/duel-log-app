-- Migration: Old Python/SQLAlchemy schema → New TypeScript/Hono schema
-- Converts INTEGER IDs to UUIDs, renames columns, restructures data
-- Production data: 568 users, 52204 duels, 12941 decks, 80 shared_statistics

BEGIN;

-- ============================================================
-- Phase 1: Create new tables with correct schema
-- ============================================================

CREATE TABLE users_new (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  is_debugger BOOLEAN NOT NULL DEFAULT false,
  theme_preference TEXT NOT NULL DEFAULT 'system',
  streamer_mode BOOLEAN NOT NULL DEFAULT false,
  enable_screen_analysis BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active',
  status_reason TEXT,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE decks_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  is_opponent_deck BOOLEAN NOT NULL DEFAULT false,
  is_generic BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE duels_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  deck_id UUID NOT NULL,
  opponent_deck_id UUID NOT NULL,
  result TEXT NOT NULL,
  game_mode TEXT NOT NULL,
  is_first BOOLEAN NOT NULL,
  won_coin_toss BOOLEAN NOT NULL,
  rank INTEGER,
  rate_value REAL,
  dc_value INTEGER,
  memo TEXT,
  dueled_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE shared_statistics_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  token TEXT NOT NULL UNIQUE,
  filters JSONB NOT NULL DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Phase 2: Create temporary mapping tables
-- ============================================================

-- User mapping: old integer id → new UUID (from supabase_uuid)
CREATE TEMPORARY TABLE user_id_map AS
SELECT id AS old_id, supabase_uuid::uuid AS new_id
FROM users;

-- Deck mapping: old integer id → new UUID
CREATE TEMPORARY TABLE deck_id_map AS
SELECT id AS old_id, gen_random_uuid() AS new_id
FROM decks;

-- ============================================================
-- Phase 3: Migrate data
-- ============================================================

-- Users
INSERT INTO users_new (id, email, display_name, is_admin, is_debugger, theme_preference, streamer_mode, enable_screen_analysis, status, status_reason, last_login_at, created_at, updated_at)
SELECT
  um.new_id,
  COALESCE(u.email, u.username || '@placeholder.local'),
  u.username,
  u.is_admin,
  false,
  u.theme_preference,
  u.streamer_mode,
  u.enable_screen_analysis,
  u.status,
  u.status_reason,
  u.last_login_at,
  u.createdat,
  u.updatedat
FROM users u
JOIN user_id_map um ON u.id = um.old_id;

-- Decks
INSERT INTO decks_new (id, user_id, name, is_opponent_deck, is_generic, active, created_at, updated_at)
SELECT
  dm.new_id,
  um.new_id,
  d.name,
  d.is_opponent,
  false,
  d.active,
  d.createdat,
  d.updatedat
FROM decks d
JOIN deck_id_map dm ON d.id = dm.old_id
JOIN user_id_map um ON d.user_id = um.old_id;

-- Duels
INSERT INTO duels_new (id, user_id, deck_id, opponent_deck_id, result, game_mode, is_first, won_coin_toss, rank, rate_value, dc_value, memo, dueled_at, created_at, updated_at)
SELECT
  gen_random_uuid(),
  um.new_id,
  dm_deck.new_id,
  dm_opp.new_id,
  CASE WHEN du.is_win THEN 'win' ELSE 'lose' END,
  du.game_mode,
  du.is_going_first,
  du.won_coin_toss,
  du.rank,
  du.rate_value,
  du.dc_value,
  du.notes,
  du.played_date,
  COALESCE(du.create_date, du.played_date),
  COALESCE(du.update_date, du.played_date)
FROM duels du
JOIN user_id_map um ON du.user_id = um.old_id
JOIN deck_id_map dm_deck ON du.deck_id = dm_deck.old_id
JOIN deck_id_map dm_opp ON du.opponent_deck_id = dm_opp.old_id;

-- Shared Statistics
INSERT INTO shared_statistics_new (id, user_id, token, filters, expires_at, created_at)
SELECT
  gen_random_uuid(),
  um.new_id,
  ss.share_id,
  jsonb_build_object('gameMode', ss.game_mode, 'from', make_timestamptz(ss.year, ss.month, 1, 0, 0, 0)::text, 'to', (make_timestamptz(ss.year, ss.month, 1, 0, 0, 0) + interval '1 month' - interval '1 second')::text),
  ss.expires_at,
  COALESCE(ss.created_at, now())
FROM shared_statistics ss
JOIN user_id_map um ON ss.user_id = um.old_id;

-- ============================================================
-- Phase 4: Drop old tables and rename new ones
-- ============================================================

DROP TABLE duels CASCADE;
DROP TABLE shared_statistics CASCADE;
DROP TABLE decks CASCADE;
DROP TABLE profiles CASCADE;
DROP TABLE users CASCADE;
DROP TABLE IF EXISTS alembic_version CASCADE;

ALTER TABLE users_new RENAME TO users;
ALTER TABLE decks_new RENAME TO decks;
ALTER TABLE duels_new RENAME TO duels;
ALTER TABLE shared_statistics_new RENAME TO shared_statistics;

-- ============================================================
-- Phase 5: Add foreign keys
-- ============================================================

ALTER TABLE decks ADD CONSTRAINT decks_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE duels ADD CONSTRAINT duels_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE duels ADD CONSTRAINT duels_deck_id_fkey FOREIGN KEY (deck_id) REFERENCES decks(id);
ALTER TABLE duels ADD CONSTRAINT duels_opponent_deck_id_fkey FOREIGN KEY (opponent_deck_id) REFERENCES decks(id);
ALTER TABLE shared_statistics ADD CONSTRAINT shared_statistics_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- ============================================================
-- Phase 6: Add indexes
-- ============================================================

CREATE INDEX idx_duels_user_mode_date ON duels(user_id, game_mode, dueled_at);
CREATE INDEX idx_duels_user_deck_result ON duels(user_id, deck_id, result);
CREATE INDEX idx_duels_matchup ON duels(user_id, deck_id, opponent_deck_id, result);
CREATE INDEX idx_decks_user_id ON decks(user_id);
CREATE INDEX idx_shared_statistics_token ON shared_statistics(token);
CREATE INDEX idx_shared_statistics_user_id ON shared_statistics(user_id);

-- ============================================================
-- Phase 7: Add triggers
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_decks_updated_at
  BEFORE UPDATE ON decks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_duels_updated_at
  BEFORE UPDATE ON duels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Phase 8: Add generic_deck_patterns table
-- ============================================================

CREATE TABLE generic_deck_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO generic_deck_patterns (pattern, description) VALUES
  ('その他', '日本語: その他'),
  ('不明', '日本語: 不明'),
  ('未分類', '日本語: 未分類'),
  ('わからない', '日本語: わからない'),
  ('未確認', '日本語: 未確認'),
  ('unknown', '英語: unknown'),
  ('other', '英語: other'),
  ('others', '英語: others'),
  ('?', '記号: ?'),
  ('？', '全角記号: ？');

-- Mark existing decks that match generic patterns
UPDATE decks SET is_generic = true
WHERE EXISTS (
  SELECT 1 FROM generic_deck_patterns p
  WHERE lower(decks.name) LIKE '%' || lower(p.pattern) || '%'
);

COMMIT;
