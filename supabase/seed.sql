-- Seed data for local development
-- Test users (password: password123 for all)
-- These UUIDs are stable for consistent local development

-- Create auth users first (Supabase Auth schema)
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token)
VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '', ''),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '', ''),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'debugger@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '', '')
ON CONFLICT (id) DO NOTHING;

-- Create auth identities
INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'email', jsonb_build_object('sub', '00000000-0000-0000-0000-000000000001', 'email', 'test@example.com'), now(), now(), now()),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'email', jsonb_build_object('sub', '00000000-0000-0000-0000-000000000002', 'email', 'admin@example.com'), now(), now(), now()),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'email', jsonb_build_object('sub', '00000000-0000-0000-0000-000000000003', 'email', 'debugger@example.com'), now(), now(), now())
ON CONFLICT (id) DO NOTHING;

-- Create app users
INSERT INTO public.users (id, email, display_name, is_admin, is_debugger)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'test@example.com', 'testuser', true, true),
  ('00000000-0000-0000-0000-000000000002', 'admin@example.com', 'admin', true, false),
  ('00000000-0000-0000-0000-000000000003', 'debugger@example.com', 'debugger', false, true)
ON CONFLICT (id) DO NOTHING;

-- Create sample decks for testuser
INSERT INTO public.decks (id, user_id, name, is_opponent_deck, active)
VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '閃刀姫', false, true),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'ティアラメンツ', false, true),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'ラビュリンス', false, true),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '相手デッキA', true, true),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '相手デッキB', true, true),
  ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '相手デッキC', true, true)
ON CONFLICT (id) DO NOTHING;

-- Create sample duels for testuser
INSERT INTO public.duels (user_id, deck_id, opponent_deck_id, result, game_mode, is_first, won_coin_toss, rank, dueled_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 'win', 'RANK', true, true, 15, now() - interval '1 day'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', 'win', 'RANK', false, false, 15, now() - interval '1 day' + interval '1 hour'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000006', 'loss', 'RANK', true, true, 14, now() - interval '23 hours'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004', 'win', 'RANK', false, false, 14, now() - interval '22 hours'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000005', 'win', 'RANK', true, true, 15, now() - interval '21 hours'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000006', 'loss', 'EVENT', true, true, null, now() - interval '20 hours'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000004', 'win', 'EVENT', false, false, null, now() - interval '19 hours'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', 'win', 'RANK', true, true, 15, now() - interval '5 hours'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000006', 'win', 'RANK', false, true, 16, now() - interval '4 hours'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004', 'loss', 'RANK', true, false, 15, now() - interval '3 hours')
ON CONFLICT DO NOTHING;
