-- Initial schema for duel-log-app

-- Users table (synced with Supabase Auth via JIT provisioning)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
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

-- Decks table
CREATE TABLE decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_opponent_deck BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Duels table
CREATE TABLE duels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  deck_id UUID NOT NULL REFERENCES decks(id),
  opponent_deck_id UUID NOT NULL REFERENCES decks(id),
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

-- Shared statistics table
CREATE TABLE shared_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  filters JSONB NOT NULL DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Performance indexes
CREATE INDEX idx_duels_user_mode_date ON duels(user_id, game_mode, dueled_at);
CREATE INDEX idx_duels_user_deck_result ON duels(user_id, deck_id, result);
CREATE INDEX idx_duels_matchup ON duels(user_id, deck_id, opponent_deck_id, result);
CREATE INDEX idx_decks_user_id ON decks(user_id);
CREATE INDEX idx_shared_statistics_token ON shared_statistics(token);
CREATE INDEX idx_shared_statistics_user_id ON shared_statistics(user_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_decks_updated_at
  BEFORE UPDATE ON decks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_duels_updated_at
  BEFORE UPDATE ON duels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE duels ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_statistics ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own data"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can read all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_admin = true
    )
  );

-- RLS Policies: decks
CREATE POLICY "Users can read own decks"
  ON decks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own decks"
  ON decks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own decks"
  ON decks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own decks"
  ON decks FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies: duels
CREATE POLICY "Users can read own duels"
  ON duels FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own duels"
  ON duels FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own duels"
  ON duels FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own duels"
  ON duels FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies: shared_statistics
CREATE POLICY "Users can manage own shared statistics"
  ON shared_statistics FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can read shared statistics by token"
  ON shared_statistics FOR SELECT
  USING (true);

-- Service role bypass (for API server using service_role key)
-- The API server uses service_role key which bypasses RLS,
-- so these policies are for direct Supabase client access.
