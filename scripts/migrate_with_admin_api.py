"""
Neon から Supabase への移行スクリプト (Admin API版)
"""

import os
import json
import requests
from datetime import datetime

# 設定
NEON_PROJECT_ID = "patient-boat-12694974"
SUPABASE_URL = "https://vdzyixwbikouwkhvvwkn.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkenlpeHdiaWtvdXdraHZ2d2tuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODI2NjA4NywiZXhwIjoyMDgzODQyMDg3fQ.EkGeVdz_ziYOOvi8iRhqbsILdHWJ4KPUetH4L42T8rY"

# Neon接続情報
NEON_DATABASE_URL = "postgresql://neondb_owner:npg_B4aOreSJ1hwR@ep-summer-union-a182z2hw-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

import psycopg2
from psycopg2.extras import RealDictCursor


def get_neon_connection():
    return psycopg2.connect(NEON_DATABASE_URL, cursor_factory=RealDictCursor)


def supabase_admin_request(method, endpoint, data=None):
    """Supabase Admin APIリクエスト"""
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json"
    }
    url = f"{SUPABASE_URL}{endpoint}"

    if method == "GET":
        response = requests.get(url, headers=headers)
    elif method == "POST":
        response = requests.post(url, headers=headers, json=data)
    elif method == "PUT":
        response = requests.put(url, headers=headers, json=data)
    else:
        raise ValueError(f"Unsupported method: {method}")

    return response


def supabase_sql(query):
    """Supabase REST APIでSQL実行"""
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    url = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"

    # 直接PostgreSQL接続を使用
    # Supabase REST APIではなく、直接DBに接続
    pass


def create_supabase_user(user):
    """Supabase Admin APIでユーザー作成"""
    email = user["email"] if user["email"] else f"{user['username']}@migrated.local"

    data = {
        "email": email,
        "email_confirm": True,
        "user_metadata": {
            "username": user["username"],
            "legacy_id": user["id"]
        }
    }

    response = supabase_admin_request("POST", "/auth/v1/admin/users", data)

    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error creating user {user['username']}: {response.text}")
        return None


def update_user_password_hash(user_id, password_hash):
    """パスワードハッシュを直接更新（Admin API経由）"""
    # Admin APIではパスワードハッシュの直接設定はサポートされていないため
    # REST APIでprofilesの更新のみ行う
    pass


def update_profile(user_uuid, user):
    """プロフィール情報を更新"""
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

    data = {
        "username": user["username"],
        "email": user["email"],
        "streamer_mode": user["streamer_mode"],
        "theme_preference": user["theme_preference"],
        "is_admin": user["is_admin"],
        "enable_screen_analysis": False
    }

    url = f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_uuid}"
    response = requests.patch(url, headers=headers, json=data)

    return response.status_code == 200 or response.status_code == 204


def insert_deck(user_uuid, deck):
    """デッキを挿入"""
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

    data = {
        "user_id": user_uuid,
        "name": deck["name"],
        "is_opponent": deck["is_opponent"],
        "active": deck["active"],
        "created_at": deck["createdat"].isoformat() if deck["createdat"] else None,
        "updated_at": deck["updatedat"].isoformat() if deck["updatedat"] else None
    }

    url = f"{SUPABASE_URL}/rest/v1/decks"
    response = requests.post(url, headers=headers, json=data)

    if response.status_code == 201:
        return response.json()[0]["id"]
    else:
        print(f"Error inserting deck: {response.text}")
        return None


def insert_duel(user_uuid, duel, deck_id_mapping):
    """対戦履歴を挿入"""
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

    new_deck_id = deck_id_mapping.get(duel["deck_id"])
    new_opponent_deck_id = deck_id_mapping.get(duel["opponent_deck_id"])

    if not new_deck_id or not new_opponent_deck_id:
        return False

    data = {
        "user_id": user_uuid,
        "deck_id": new_deck_id,
        "opponent_deck_id": new_opponent_deck_id,
        "is_win": duel["is_win"],
        "game_mode": duel["game_mode"],
        "rank": duel["rank"],
        "rate_value": duel["rate_value"],
        "dc_value": duel["dc_value"],
        "won_coin_toss": duel["won_coin_toss"],
        "is_going_first": duel["is_going_first"],
        "played_date": duel["played_date"].isoformat() if duel["played_date"] else None,
        "notes": duel["notes"],
        "create_date": duel["create_date"].isoformat() if duel["create_date"] else None,
        "update_date": duel["update_date"].isoformat() if duel["update_date"] else None
    }

    url = f"{SUPABASE_URL}/rest/v1/duels"
    response = requests.post(url, headers=headers, json=data)

    return response.status_code == 201


def main():
    print("=" * 60)
    print("Neon -> Supabase Migration (Admin API)")
    print("=" * 60)

    # Neon接続
    print("\n1. Connecting to Neon...")
    neon_conn = get_neon_connection()
    neon_cursor = neon_conn.cursor()

    # ユーザー取得
    print("\n2. Fetching users from Neon...")
    neon_cursor.execute("""
        SELECT id, username, email, passwordhash,
               COALESCE(streamer_mode, false) as streamer_mode,
               COALESCE(theme_preference, 'dark') as theme_preference,
               COALESCE(is_admin, false) as is_admin,
               createdat, updatedat
        FROM users ORDER BY id
    """)
    users = neon_cursor.fetchall()
    print(f"   Found {len(users)} users")

    # ユーザー移行
    print("\n3. Migrating users...")
    user_id_mapping = {}  # old_id -> new_uuid

    for i, user in enumerate(users):
        result = create_supabase_user(user)
        if result:
            new_uuid = result["id"]
            user_id_mapping[user["id"]] = new_uuid

            # プロフィール更新
            update_profile(new_uuid, user)

            if (i + 1) % 50 == 0:
                print(f"   Migrated {i + 1}/{len(users)} users...")

    print(f"   Completed: {len(user_id_mapping)}/{len(users)} users migrated")

    # デッキ取得
    print("\n4. Fetching decks from Neon...")
    neon_cursor.execute("""
        SELECT id, user_id, name, is_opponent, active, createdat, updatedat
        FROM decks ORDER BY id
    """)
    decks = neon_cursor.fetchall()
    print(f"   Found {len(decks)} decks")

    # デッキ移行
    print("\n5. Migrating decks...")
    deck_id_mapping = {}  # old_id -> new_id

    for i, deck in enumerate(decks):
        user_uuid = user_id_mapping.get(deck["user_id"])
        if user_uuid:
            new_id = insert_deck(user_uuid, deck)
            if new_id:
                deck_id_mapping[deck["id"]] = new_id

        if (i + 1) % 500 == 0:
            print(f"   Migrated {i + 1}/{len(decks)} decks...")

    print(f"   Completed: {len(deck_id_mapping)}/{len(decks)} decks migrated")

    # 対戦履歴取得
    print("\n6. Fetching duels from Neon...")
    neon_cursor.execute("""
        SELECT id, user_id, deck_id, opponent_deck_id,
               is_win, game_mode, rank, rate_value, dc_value,
               won_coin_toss, is_going_first, played_date, notes,
               create_date, update_date
        FROM duels ORDER BY id
    """)
    duels = neon_cursor.fetchall()
    print(f"   Found {len(duels)} duels")

    # 対戦履歴移行
    print("\n7. Migrating duels...")
    migrated_duels = 0

    for i, duel in enumerate(duels):
        user_uuid = user_id_mapping.get(duel["user_id"])
        if user_uuid:
            if insert_duel(user_uuid, duel, deck_id_mapping):
                migrated_duels += 1

        if (i + 1) % 1000 == 0:
            print(f"   Migrated {i + 1}/{len(duels)} duels...")

    print(f"   Completed: {migrated_duels}/{len(duels)} duels migrated")

    # マッピング保存
    print("\n8. Saving ID mappings...")
    mapping = {
        "users": {str(k): v for k, v in user_id_mapping.items()},
        "decks": {str(k): v for k, v in deck_id_mapping.items()}
    }
    with open("migration_mapping.json", "w") as f:
        json.dump(mapping, f, indent=2)

    print("\n" + "=" * 60)
    print("Migration completed!")
    print(f"  Users: {len(user_id_mapping)}")
    print(f"  Decks: {len(deck_id_mapping)}")
    print(f"  Duels: {migrated_duels}")
    print("=" * 60)

    neon_cursor.close()
    neon_conn.close()


if __name__ == "__main__":
    main()
