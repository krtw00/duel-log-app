ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS show_play_mistake_stats boolean NOT NULL DEFAULT false;
