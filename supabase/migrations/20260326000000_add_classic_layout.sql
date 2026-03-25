ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS classic_layout boolean NOT NULL DEFAULT false;
