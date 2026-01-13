"""
Neon から Supabase への完全移行スクリプト

使用方法:
1. 環境変数を設定
   - NEON_DATABASE_URL: Neonの接続文字列
   - SUPABASE_DB_URL: Supabaseの接続文字列
   - SUPABASE_SERVICE_ROLE_KEY: Supabaseのサービスロールキー

2. 実行
   python scripts/migrate_to_supabase.py
"""

import os
import json
import uuid
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor
import requests

# 環境変数から接続情報を取得
NEON_DATABASE_URL = os.environ.get("NEON_DATABASE_URL")
SUPABASE_DB_URL = os.environ.get("SUPABASE_DB_URL")
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")


def get_neon_connection():
    """Neonへの接続を取得"""
    return psycopg2.connect(NEON_DATABASE_URL, cursor_factory=RealDictCursor)


def get_supabase_connection():
    """Supabaseへの接続を取得"""
    return psycopg2.connect(SUPABASE_DB_URL, cursor_factory=RealDictCursor)


def export_users_from_neon(cursor):
    """Neonからユーザーデータをエクスポート"""
    cursor.execute("""
        SELECT
            id, username, email, passwordhash,
            streamer_mode, theme_preference, is_admin,
            enable_screen_analysis, createdat, updatedat
        FROM users
        ORDER BY id
    """)
    return cursor.fetchall()


def export_decks_from_neon(cursor):
    """Neonからデッキデータをエクスポート"""
    cursor.execute("""
        SELECT
            id, user_id, name, is_opponent, active,
            createdat, updatedat
        FROM decks
        ORDER BY id
    """)
    return cursor.fetchall()


def export_duels_from_neon(cursor):
    """Neonから対戦履歴をエクスポート"""
    cursor.execute("""
        SELECT
            id, user_id, deck_id, opponent_deck_id,
            is_win, game_mode, rank, rate_value, dc_value,
            won_coin_toss, is_going_first, played_date, notes,
            create_date, update_date
        FROM duels
        ORDER BY id
    """)
    return cursor.fetchall()


def export_shared_statistics_from_neon(cursor):
    """Neonから共有統計データをエクスポート"""
    cursor.execute("""
        SELECT
            id, share_id, user_id, year, month,
            game_mode, created_at, expires_at
        FROM shared_statistics
        ORDER BY id
    """)
    return cursor.fetchall()


def export_shared_urls_from_neon(cursor):
    """NeonからレガシーURLデータをエクスポート"""
    cursor.execute("""
        SELECT
            id, user_id, year_month, url,
            createdat, updatedat
        FROM sharedurls
        ORDER BY id
    """)
    return cursor.fetchall()


def import_user_to_supabase_auth(user, service_role_key):
    """
    Supabase Auth Admin APIを使ってユーザーをインポート
    bcryptハッシュをそのまま使用
    """
    headers = {
        "apikey": service_role_key,
        "Authorization": f"Bearer {service_role_key}",
        "Content-Type": "application/json"
    }

    # Supabase Auth Admin API
    url = f"{SUPABASE_URL}/auth/v1/admin/users"

    payload = {
        "email": user["email"] if user["email"] else f"{user['username']}@placeholder.local",
        "password": None,  # パスワードは直接設定しない
        "email_confirm": True,
        "user_metadata": {
            "username": user["username"],
            "legacy_id": user["id"]
        }
    }

    response = requests.post(url, headers=headers, json=payload)

    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error importing user {user['username']}: {response.text}")
        return None


def update_user_password_hash(supabase_cursor, user_uuid, password_hash):
    """
    Supabase auth.usersテーブルのパスワードハッシュを直接更新
    bcryptハッシュをそのまま使用可能
    """
    supabase_cursor.execute("""
        UPDATE auth.users
        SET encrypted_password = %s
        WHERE id = %s
    """, (password_hash, user_uuid))


def migrate_users(neon_cursor, supabase_cursor):
    """ユーザーを移行し、ID マッピングを返す"""
    users = export_users_from_neon(neon_cursor)
    id_mapping = {}  # old_id -> new_uuid

    print(f"Migrating {len(users)} users...")

    for user in users:
        # 新しいUUIDを生成
        new_uuid = str(uuid.uuid4())

        # auth.usersに直接挿入
        supabase_cursor.execute("""
            INSERT INTO auth.users (
                id, instance_id, email, encrypted_password,
                email_confirmed_at, created_at, updated_at,
                raw_user_meta_data, aud, role
            ) VALUES (
                %s, '00000000-0000-0000-0000-000000000000',
                %s, %s, now(), %s, %s,
                %s, 'authenticated', 'authenticated'
            )
        """, (
            new_uuid,
            user["email"] if user["email"] else f"{user['username']}@migrated.local",
            user["passwordhash"],
            user["createdat"],
            user["updatedat"],
            json.dumps({"username": user["username"], "legacy_id": user["id"]})
        ))

        # profilesにも挿入（トリガーが動かないので手動で）
        supabase_cursor.execute("""
            INSERT INTO public.profiles (
                id, username, email, streamer_mode, theme_preference,
                is_admin, enable_screen_analysis, created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            new_uuid,
            user["username"],
            user["email"],
            user["streamer_mode"],
            user["theme_preference"],
            user["is_admin"],
            user["enable_screen_analysis"],
            user["createdat"],
            user["updatedat"]
        ))

        id_mapping[user["id"]] = new_uuid
        print(f"  Migrated user: {user['username']} (old: {user['id']} -> new: {new_uuid})")

    return id_mapping


def migrate_decks(neon_cursor, supabase_cursor, user_id_mapping):
    """デッキを移行し、IDマッピングを返す"""
    decks = export_decks_from_neon(neon_cursor)
    deck_id_mapping = {}  # old_id -> new_id

    print(f"Migrating {len(decks)} decks...")

    for deck in decks:
        new_user_uuid = user_id_mapping.get(deck["user_id"])
        if not new_user_uuid:
            print(f"  Skipping deck {deck['id']}: user {deck['user_id']} not found")
            continue

        supabase_cursor.execute("""
            INSERT INTO public.decks (
                user_id, name, is_opponent, active, created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            new_user_uuid,
            deck["name"],
            deck["is_opponent"],
            deck["active"],
            deck["createdat"],
            deck["updatedat"]
        ))

        new_id = supabase_cursor.fetchone()["id"]
        deck_id_mapping[deck["id"]] = new_id

    print(f"  Migrated {len(deck_id_mapping)} decks")
    return deck_id_mapping


def migrate_duels(neon_cursor, supabase_cursor, user_id_mapping, deck_id_mapping):
    """対戦履歴を移行"""
    duels = export_duels_from_neon(neon_cursor)
    migrated_count = 0

    print(f"Migrating {len(duels)} duels...")

    for duel in duels:
        new_user_uuid = user_id_mapping.get(duel["user_id"])
        new_deck_id = deck_id_mapping.get(duel["deck_id"])
        new_opponent_deck_id = deck_id_mapping.get(duel["opponent_deck_id"])

        if not all([new_user_uuid, new_deck_id, new_opponent_deck_id]):
            print(f"  Skipping duel {duel['id']}: missing references")
            continue

        supabase_cursor.execute("""
            INSERT INTO public.duels (
                user_id, deck_id, opponent_deck_id,
                is_win, game_mode, rank, rate_value, dc_value,
                won_coin_toss, is_going_first, played_date, notes,
                create_date, update_date
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            new_user_uuid,
            new_deck_id,
            new_opponent_deck_id,
            duel["is_win"],
            duel["game_mode"],
            duel["rank"],
            duel["rate_value"],
            duel["dc_value"],
            duel["won_coin_toss"],
            duel["is_going_first"],
            duel["played_date"],
            duel["notes"],
            duel["create_date"],
            duel["update_date"]
        ))
        migrated_count += 1

    print(f"  Migrated {migrated_count} duels")


def migrate_shared_statistics(neon_cursor, supabase_cursor, user_id_mapping):
    """共有統計を移行"""
    stats = export_shared_statistics_from_neon(neon_cursor)
    migrated_count = 0

    print(f"Migrating {len(stats)} shared statistics...")

    for stat in stats:
        new_user_uuid = user_id_mapping.get(stat["user_id"])
        if not new_user_uuid:
            continue

        supabase_cursor.execute("""
            INSERT INTO public.shared_statistics (
                share_id, user_id, year, month, game_mode, created_at, expires_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            stat["share_id"],
            new_user_uuid,
            stat["year"],
            stat["month"],
            stat["game_mode"],
            stat["created_at"],
            stat["expires_at"]
        ))
        migrated_count += 1

    print(f"  Migrated {migrated_count} shared statistics")


def migrate_shared_urls(neon_cursor, supabase_cursor, user_id_mapping):
    """レガシーURLを移行"""
    urls = export_shared_urls_from_neon(neon_cursor)
    migrated_count = 0

    print(f"Migrating {len(urls)} shared URLs...")

    for url in urls:
        new_user_uuid = user_id_mapping.get(url["user_id"])
        if not new_user_uuid:
            continue

        supabase_cursor.execute("""
            INSERT INTO public.shared_urls (
                user_id, year_month, url, created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s)
        """, (
            new_user_uuid,
            url["year_month"],
            url["url"],
            url["createdat"],
            url["updatedat"]
        ))
        migrated_count += 1

    print(f"  Migrated {migrated_count} shared URLs")


def main():
    """メイン移行処理"""
    print("=" * 60)
    print("Neon -> Supabase Migration Script")
    print("=" * 60)

    # 接続確認
    if not all([NEON_DATABASE_URL, SUPABASE_DB_URL]):
        print("Error: Missing environment variables")
        print("Required: NEON_DATABASE_URL, SUPABASE_DB_URL")
        return

    print("\n1. Connecting to databases...")
    neon_conn = get_neon_connection()
    supabase_conn = get_supabase_connection()

    neon_cursor = neon_conn.cursor()
    supabase_cursor = supabase_conn.cursor()

    try:
        print("\n2. Migrating users...")
        user_id_mapping = migrate_users(neon_cursor, supabase_cursor)

        print("\n3. Migrating decks...")
        deck_id_mapping = migrate_decks(neon_cursor, supabase_cursor, user_id_mapping)

        print("\n4. Migrating duels...")
        migrate_duels(neon_cursor, supabase_cursor, user_id_mapping, deck_id_mapping)

        print("\n5. Migrating shared statistics...")
        migrate_shared_statistics(neon_cursor, supabase_cursor, user_id_mapping)

        print("\n6. Migrating shared URLs...")
        migrate_shared_urls(neon_cursor, supabase_cursor, user_id_mapping)

        print("\n7. Committing changes...")
        supabase_conn.commit()

        print("\n" + "=" * 60)
        print("Migration completed successfully!")
        print(f"  - Users: {len(user_id_mapping)}")
        print(f"  - Decks: {len(deck_id_mapping)}")
        print("=" * 60)

        # IDマッピングを保存
        mapping_file = "migration_id_mapping.json"
        with open(mapping_file, "w") as f:
            json.dump({
                "users": {str(k): v for k, v in user_id_mapping.items()},
                "decks": {str(k): v for k, v in deck_id_mapping.items()}
            }, f, indent=2)
        print(f"\nID mapping saved to: {mapping_file}")

    except Exception as e:
        print(f"\nError during migration: {e}")
        supabase_conn.rollback()
        raise
    finally:
        neon_cursor.close()
        supabase_cursor.close()
        neon_conn.close()
        supabase_conn.close()


if __name__ == "__main__":
    main()
