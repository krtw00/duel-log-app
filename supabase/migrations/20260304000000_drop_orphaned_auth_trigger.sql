-- Fix: "Database error saving new user" on signup
--
-- The migration 20260124 dropped the `profiles` table but did NOT drop the
-- trigger on auth.users that referenced it. When a new user signs up,
-- GoTrue fires the trigger which tries to INSERT into the now-nonexistent
-- `profiles` table, causing the error.
--
-- The app uses JIT provisioning in the API middleware (auth.ts) to create
-- public.users rows, so this trigger is not needed.

-- Drop the trigger on auth.users (common Supabase template names)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the function that the trigger called
DROP FUNCTION IF EXISTS public.handle_new_user();
