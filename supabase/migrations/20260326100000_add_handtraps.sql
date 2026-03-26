ALTER TABLE public.duels
  ADD COLUMN IF NOT EXISTS opponent_handtraps text[] NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS public.user_handtrap_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

ALTER TABLE public.user_handtrap_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own handtrap cards" ON public.user_handtrap_cards;

CREATE POLICY "Users can manage their own handtrap cards"
  ON public.user_handtrap_cards
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
