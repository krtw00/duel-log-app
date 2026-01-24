-- Seed data for local development
-- Test users (password: password123 for all)
-- These UUIDs are stable for consistent local development

-- Create auth users first (Supabase Auth schema)
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  confirmation_token, recovery_token,
  email_change, email_change_token_new, email_change_token_current,
  phone_change, phone_change_token,
  reauthentication_token,
  raw_app_meta_data, raw_user_meta_data
)
VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '', '', '', '', '', '', '', '', '{"provider": "email", "providers": ["email"]}', '{"display_name": "testuser"}'),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '', '', '', '', '', '', '', '', '{"provider": "email", "providers": ["email"]}', '{"display_name": "admin"}'),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'debugger@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '', '', '', '', '', '', '', '', '{"provider": "email", "providers": ["email"]}', '{"display_name": "debugger"}')
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

----------------------------------------------------------------------
-- Decks: 各ユーザーにプレイヤーデッキ3つ + 相手デッキ8つ + ジェネリック4つ
----------------------------------------------------------------------

-- === testuser (user 001) ===
INSERT INTO public.decks (id, user_id, name, is_opponent_deck, is_generic, active) VALUES
  -- Player decks
  ('10000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001', '閃刀姫', false, false, true),
  ('10000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000001', 'ティアラメンツ', false, false, true),
  ('10000000-0000-0000-0001-000000000003', '00000000-0000-0000-0000-000000000001', 'ラビュリンス', false, false, true),
  -- Opponent decks
  ('10000000-0000-0000-0001-000000000011', '00000000-0000-0000-0000-000000000001', 'スネークアイ', true, false, true),
  ('10000000-0000-0000-0001-000000000012', '00000000-0000-0000-0000-000000000001', '粛声', true, false, true),
  ('10000000-0000-0000-0001-000000000013', '00000000-0000-0000-0000-000000000001', 'デモンスミス', true, false, true),
  ('10000000-0000-0000-0001-000000000014', '00000000-0000-0000-0000-000000000001', '炎王', true, false, true),
  ('10000000-0000-0000-0001-000000000015', '00000000-0000-0000-0000-000000000001', 'ユベル', true, false, true),
  ('10000000-0000-0000-0001-000000000016', '00000000-0000-0000-0000-000000000001', 'R-ACE', true, false, true),
  ('10000000-0000-0000-0001-000000000017', '00000000-0000-0000-0000-000000000001', 'センチュリオン', true, false, true),
  ('10000000-0000-0000-0001-000000000018', '00000000-0000-0000-0000-000000000001', 'ホルス', true, false, true),
  -- Generic decks
  ('10000000-0000-0000-0001-0000000000f1', '00000000-0000-0000-0000-000000000001', '不明', true, true, true),
  ('10000000-0000-0000-0001-0000000000f2', '00000000-0000-0000-0000-000000000001', 'その他', true, true, true),
  ('10000000-0000-0000-0001-0000000000f3', '00000000-0000-0000-0000-000000000001', 'わからない', true, true, true),
  ('10000000-0000-0000-0001-0000000000f4', '00000000-0000-0000-0000-000000000001', '未確認デッキ', true, true, true)
ON CONFLICT (id) DO NOTHING;

-- === admin (user 002) ===
INSERT INTO public.decks (id, user_id, name, is_opponent_deck, is_generic, active) VALUES
  ('10000000-0000-0000-0002-000000000001', '00000000-0000-0000-0000-000000000002', 'スネークアイ', false, false, true),
  ('10000000-0000-0000-0002-000000000002', '00000000-0000-0000-0000-000000000002', '粛声', false, false, true),
  ('10000000-0000-0000-0002-000000000003', '00000000-0000-0000-0000-000000000002', 'デモンスミス', false, false, true),
  ('10000000-0000-0000-0002-000000000011', '00000000-0000-0000-0000-000000000002', '閃刀姫', true, false, true),
  ('10000000-0000-0000-0002-000000000012', '00000000-0000-0000-0000-000000000002', 'ティアラメンツ', true, false, true),
  ('10000000-0000-0000-0002-000000000013', '00000000-0000-0000-0000-000000000002', 'ラビュリンス', true, false, true),
  ('10000000-0000-0000-0002-000000000014', '00000000-0000-0000-0000-000000000002', '炎王', true, false, true),
  ('10000000-0000-0000-0002-000000000015', '00000000-0000-0000-0000-000000000002', 'ユベル', true, false, true),
  ('10000000-0000-0000-0002-000000000016', '00000000-0000-0000-0000-000000000002', 'R-ACE', true, false, true),
  ('10000000-0000-0000-0002-000000000017', '00000000-0000-0000-0000-000000000002', 'センチュリオン', true, false, true),
  ('10000000-0000-0000-0002-000000000018', '00000000-0000-0000-0000-000000000002', 'ホルス', true, false, true),
  ('10000000-0000-0000-0002-0000000000f1', '00000000-0000-0000-0000-000000000002', '不明', true, true, true),
  ('10000000-0000-0000-0002-0000000000f2', '00000000-0000-0000-0000-000000000002', 'その他', true, true, true),
  ('10000000-0000-0000-0002-0000000000f3', '00000000-0000-0000-0000-000000000002', 'わからない', true, true, true),
  ('10000000-0000-0000-0002-0000000000f4', '00000000-0000-0000-0000-000000000002', '未確認デッキ', true, true, true)
ON CONFLICT (id) DO NOTHING;

-- === debugger (user 003) ===
INSERT INTO public.decks (id, user_id, name, is_opponent_deck, is_generic, active) VALUES
  ('10000000-0000-0000-0003-000000000001', '00000000-0000-0000-0000-000000000003', '炎王', false, false, true),
  ('10000000-0000-0000-0003-000000000002', '00000000-0000-0000-0000-000000000003', 'ユベル', false, false, true),
  ('10000000-0000-0000-0003-000000000003', '00000000-0000-0000-0000-000000000003', 'R-ACE', false, false, true),
  ('10000000-0000-0000-0003-000000000011', '00000000-0000-0000-0000-000000000003', '閃刀姫', true, false, true),
  ('10000000-0000-0000-0003-000000000012', '00000000-0000-0000-0000-000000000003', 'ティアラメンツ', true, false, true),
  ('10000000-0000-0000-0003-000000000013', '00000000-0000-0000-0000-000000000003', 'ラビュリンス', true, false, true),
  ('10000000-0000-0000-0003-000000000014', '00000000-0000-0000-0000-000000000003', 'スネークアイ', true, false, true),
  ('10000000-0000-0000-0003-000000000015', '00000000-0000-0000-0000-000000000003', '粛声', true, false, true),
  ('10000000-0000-0000-0003-000000000016', '00000000-0000-0000-0000-000000000003', 'デモンスミス', true, false, true),
  ('10000000-0000-0000-0003-000000000017', '00000000-0000-0000-0000-000000000003', 'センチュリオン', true, false, true),
  ('10000000-0000-0000-0003-000000000018', '00000000-0000-0000-0000-000000000003', 'ホルス', true, false, true),
  ('10000000-0000-0000-0003-0000000000f1', '00000000-0000-0000-0000-000000000003', '不明', true, true, true),
  ('10000000-0000-0000-0003-0000000000f2', '00000000-0000-0000-0000-000000000003', 'その他', true, true, true),
  ('10000000-0000-0000-0003-0000000000f3', '00000000-0000-0000-0000-000000000003', 'わからない', true, true, true),
  ('10000000-0000-0000-0003-0000000000f4', '00000000-0000-0000-0000-000000000003', '未確認デッキ', true, true, true)
ON CONFLICT (id) DO NOTHING;

----------------------------------------------------------------------
-- Duels: 各ユーザー × 各モード 60-80戦 を PL/pgSQL で生成
----------------------------------------------------------------------
DO $$
DECLARE
  v_user_id uuid;
  v_user_idx int;
  v_user_ids uuid[] := ARRAY[
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000003'::uuid
  ];
  v_mode text;
  v_modes text[] := ARRAY['RANK', 'RATE', 'EVENT', 'DC'];
  v_player_decks uuid[];
  v_opponent_decks uuid[];
  v_generic_decks uuid[];
  v_deck_id uuid;
  v_opp_id uuid;
  v_result text;
  v_is_first boolean;
  v_won_coin_toss boolean;
  v_rank int;
  v_rate_value real;
  v_dc_value int;
  v_dueled_at timestamptz;
  v_num_duels int;
  v_base_rank int;
  v_user_prefix text;
  v_delta real;
  v_dc_loss int;
  v_dc_base_time timestamptz;
  i int;
BEGIN
  FOR v_user_idx IN 1..3 LOOP
    v_user_id := v_user_ids[v_user_idx];
    v_user_prefix := '10000000-0000-0000-000' || v_user_idx || '-';

    -- このユーザーのデッキID配列を構築
    v_player_decks := ARRAY[
      (v_user_prefix || '000000000001')::uuid,
      (v_user_prefix || '000000000002')::uuid,
      (v_user_prefix || '000000000003')::uuid
    ];
    v_opponent_decks := ARRAY[
      (v_user_prefix || '000000000011')::uuid,
      (v_user_prefix || '000000000012')::uuid,
      (v_user_prefix || '000000000013')::uuid,
      (v_user_prefix || '000000000014')::uuid,
      (v_user_prefix || '000000000015')::uuid,
      (v_user_prefix || '000000000016')::uuid,
      (v_user_prefix || '000000000017')::uuid,
      (v_user_prefix || '000000000018')::uuid
    ];
    v_generic_decks := ARRAY[
      (v_user_prefix || '0000000000f1')::uuid,
      (v_user_prefix || '0000000000f2')::uuid,
      (v_user_prefix || '0000000000f3')::uuid,
      (v_user_prefix || '0000000000f4')::uuid
    ];

    -- ユーザーごとに異なるランク基準値
    v_base_rank := 12 + v_user_idx * 3;  -- 15, 18, 21

    FOREACH v_mode IN ARRAY v_modes LOOP
      -- 各モード 60-80戦
      v_num_duels := 60 + floor(random() * 21)::int;

      -- RATE: 1500.00からスタート
      v_rate_value := 1500.00;
      -- DC: 0からスタート、3日間イベント
      v_dc_value := 0;
      v_dc_base_time := now() - interval '3 days';

      FOR i IN 1..v_num_duels LOOP
        -- ランダムにデッキ選択
        v_deck_id := v_player_decks[1 + floor(random() * 3)::int];

        -- 80%通常デッキ、20%ジェネリック
        IF random() < 0.8 THEN
          v_opp_id := v_opponent_decks[1 + floor(random() * 8)::int];
        ELSE
          v_opp_id := v_generic_decks[1 + floor(random() * 4)::int];
        END IF;

        -- 勝率55-65%（ユーザーごとに少し変動）
        v_result := CASE WHEN random() < (0.55 + v_user_idx * 0.03) THEN 'win' ELSE 'loss' END;

        -- 先攻率50%
        v_is_first := random() < 0.50;
        -- じゃんけん勝率50%
        v_won_coin_toss := random() < 0.50;

        -- モード別の時間と値
        v_rank := NULL;

        CASE v_mode
          WHEN 'RANK' THEN
            -- 時間: 過去60日間に分散
            v_dueled_at := now() - (random() * 60)::int * interval '1 day'
                         - (random() * 24)::int * interval '1 hour'
                         - (random() * 60)::int * interval '1 minute';
            -- ランクは基準±5で変動
            v_rank := v_base_rank + floor(random() * 6 - 2)::int;
            IF v_rank < 1 THEN v_rank := 1; END IF;
            IF v_rank > 32 THEN v_rank := 32; END IF;
            v_rate_value := NULL;
            v_dc_value := NULL;

          WHEN 'RATE' THEN
            -- 時間: 過去60日間に分散（時系列順）
            v_dueled_at := now() - (60 - (i::real / v_num_duels * 60))::int * interval '1 day'
                         - (random() * 12)::int * interval '1 hour'
                         - (random() * 60)::int * interval '1 minute';
            -- レート: 勝ち+1.00~5.00、負け-1.00~5.00、最低1200
            v_delta := 1.00 + (random() * 4.00)::real;
            IF v_result = 'win' THEN
              v_rate_value := v_rate_value + v_delta;
            ELSE
              v_rate_value := v_rate_value - v_delta;
              IF v_rate_value < 1200.00 THEN v_rate_value := 1200.00; END IF;
            END IF;
            v_rank := NULL;
            v_dc_value := NULL;

          WHEN 'DC' THEN
            -- 時間: 3日間に分散（時系列順）
            v_dueled_at := v_dc_base_time
                         + ((i::real / v_num_duels) * 3.0) * interval '1 day'
                         + (random() * 60)::int * interval '1 minute';
            -- DC: 勝ち+1000、負けは状況による
            IF v_result = 'win' THEN
              v_dc_value := v_dc_value + 1000;
            ELSE
              IF v_dc_value < 10000 THEN
                -- 1万未満: 1000未満の下降 (100-999)
                v_dc_loss := 100 + floor(random() * 900)::int;
              ELSE
                -- 1万以上: 1000-1100の下降
                v_dc_loss := 1000 + floor(random() * 101)::int;
              END IF;
              v_dc_value := v_dc_value - v_dc_loss;
              IF v_dc_value < 0 THEN v_dc_value := 0; END IF;
            END IF;
            v_rank := NULL;
            v_rate_value := NULL;

          ELSE
            -- EVENT: 値なし、過去60日間に分散
            v_dueled_at := now() - (random() * 60)::int * interval '1 day'
                         - (random() * 24)::int * interval '1 hour'
                         - (random() * 60)::int * interval '1 minute';
            v_rate_value := NULL;
            v_dc_value := NULL;
        END CASE;

        INSERT INTO public.duels (
          user_id, deck_id, opponent_deck_id, result, game_mode,
          is_first, won_coin_toss, rank, rate_value, dc_value, dueled_at
        ) VALUES (
          v_user_id, v_deck_id, v_opp_id, v_result, v_mode,
          v_is_first, v_won_coin_toss, v_rank, v_rate_value, v_dc_value, v_dueled_at
        );
      END LOOP;
    END LOOP;
  END LOOP;
END $$;
