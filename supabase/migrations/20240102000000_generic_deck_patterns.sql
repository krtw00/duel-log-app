-- Add is_generic flag to decks table
ALTER TABLE decks ADD COLUMN is_generic BOOLEAN NOT NULL DEFAULT false;

-- Create generic_deck_patterns master table
CREATE TABLE generic_deck_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default patterns
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

-- Update existing decks that match patterns
UPDATE decks SET is_generic = true
WHERE EXISTS (
  SELECT 1 FROM generic_deck_patterns p
  WHERE lower(decks.name) LIKE '%' || lower(p.pattern) || '%'
);

-- RLS policies for generic_deck_patterns (read-only for authenticated users)
ALTER TABLE generic_deck_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read generic_deck_patterns"
  ON generic_deck_patterns FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage generic_deck_patterns"
  ON generic_deck_patterns FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );
