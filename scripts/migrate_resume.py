"""
Neon から Supabase への移行スクリプト (再開可能版)
- 既存マッピングを復元
- リトライ機能
- バッチ処理とディレイ
"""

import os
import json
import time
import requests
from datetime import datetime
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# 設定
NEON_PROJECT_ID = "patient-boat-12694974"
SUPABASE_URL = "https://vdzyixwbikouwkhvvwkn.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkenlpeHdiaWtvdXdraHZ2d2tuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODI2NjA4NywiZXhwIjoyMDgzODQyMDg3fQ.EkGeVdz_ziYOOvi8iRhqbsILdHWJ4KPUetH4L42T8rY"

# Neon接続情報
NEON_DATABASE_URL = "postgresql://neondb_owner:npg_B4aOreSJ1hwR@ep-summer-union-a182z2hw-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

# バッチ設定
BATCH_SIZE = 100
BATCH_DELAY = 1.0  # 秒

import psycopg2
from psycopg2.extras import RealDictCursor


def create_session_with_retries():
    """リトライ機能付きセッションを作成"""
    session = requests.Session()
    retries = Retry(
        total=5,
        backoff_factor=1,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["HEAD", "GET", "POST", "PUT", "PATCH", "DELETE"]
    )
    adapter = HTTPAdapter(max_retries=retries)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    return session


def get_neon_connection():
    return psycopg2.connect(NEON_DATABASE_URL, cursor_factory=RealDictCursor)


def get_headers():
    return {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }


def fetch_existing_user_mapping(session):
    """Supabaseから既存ユーザーのマッピングを取得"""
    print("Fetching existing user mapping from Supabase...")

    headers = get_headers()
    url = f"{SUPABASE_URL}/auth/v1/admin/users"

    all_users = []
    page = 1
    per_page = 100

    while True:
        response = session.get(
            url,
            headers=headers,
            params={"page": page, "per_page": per_page}
        )

        if response.status_code != 200:
            print(f"Error fetching users: {response.text}")
            break

        data = response.json()
        users = data.get("users", [])

        if not users:
            break

        all_users.extend(users)
        print(f"  Fetched {len(all_users)} users...")

        if len(users) < per_page:
            break

        page += 1
        time.sleep(0.5)

    # legacy_id -> uuid マッピングを作成
    user_mapping = {}
    for user in all_users:
        meta = user.get("user_metadata", {})
        legacy_id = meta.get("legacy_id")
        if legacy_id:
            user_mapping[legacy_id] = user["id"]

    print(f"  Found {len(user_mapping)} users with legacy_id")
    return user_mapping


def fetch_existing_deck_mapping(session):
    """Supabaseから既存デッキのマッピングを取得（legacy_idはないのでユニーク制約で判断）"""
    print("Fetching existing decks from Supabase...")

    headers = get_headers()
    url = f"{SUPABASE_URL}/rest/v1/decks"

    all_decks = []
    offset = 0
    limit = 1000

    while True:
        response = session.get(
            url,
            headers=headers,
            params={
                "select": "id,user_id,name,is_opponent",
                "offset": offset,
                "limit": limit
            }
        )

        if response.status_code != 200:
            print(f"Error fetching decks: {response.text}")
            break

        decks = response.json()

        if not decks:
            break

        all_decks.extend(decks)
        print(f"  Fetched {len(all_decks)} decks...")

        if len(decks) < limit:
            break

        offset += limit
        time.sleep(0.5)

    print(f"  Total {len(all_decks)} decks in Supabase")
    return all_decks


def insert_deck_with_retry(session, user_uuid, deck, max_retries=3):
    """デッキを挿入（リトライ付き）"""
    headers = get_headers()

    data = {
        "user_id": user_uuid,
        "name": deck["name"],
        "is_opponent": deck["is_opponent"],
        "active": deck["active"],
        "created_at": deck["createdat"].isoformat() if deck["createdat"] else None,
        "updated_at": deck["updatedat"].isoformat() if deck["updatedat"] else None
    }

    url = f"{SUPABASE_URL}/rest/v1/decks"

    for attempt in range(max_retries):
        try:
            response = session.post(url, headers=headers, json=data, timeout=30)

            if response.status_code == 201:
                return response.json()[0]["id"]
            elif response.status_code == 409:
                # 既に存在する場合はスキップ
                return None
            else:
                print(f"Error inserting deck (attempt {attempt + 1}): {response.status_code} - {response.text}")

        except Exception as e:
            print(f"Exception inserting deck (attempt {attempt + 1}): {e}")

        time.sleep(2 ** attempt)  # 指数バックオフ

    return None


def insert_duel_with_retry(session, user_uuid, duel, deck_id_mapping, max_retries=3):
    """対戦履歴を挿入（リトライ付き）"""
    headers = get_headers()

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

    for attempt in range(max_retries):
        try:
            response = session.post(url, headers=headers, json=data, timeout=30)

            if response.status_code == 201:
                return True
            elif response.status_code == 409:
                return True  # 既存
            else:
                print(f"Error inserting duel (attempt {attempt + 1}): {response.status_code}")

        except Exception as e:
            print(f"Exception inserting duel (attempt {attempt + 1}): {e}")

        time.sleep(2 ** attempt)

    return False


def save_mapping(user_mapping, deck_mapping, filename="migration_mapping.json"):
    """マッピングを保存"""
    mapping = {
        "users": {str(k): v for k, v in user_mapping.items()},
        "decks": {str(k): v for k, v in deck_mapping.items()},
        "saved_at": datetime.now().isoformat()
    }
    with open(filename, "w") as f:
        json.dump(mapping, f, indent=2)
    print(f"Mapping saved to {filename}")


def load_mapping(filename="migration_mapping.json"):
    """マッピングを読み込み"""
    try:
        with open(filename, "r") as f:
            mapping = json.load(f)
        return (
            {int(k): v for k, v in mapping.get("users", {}).items()},
            {int(k): v for k, v in mapping.get("decks", {}).items()}
        )
    except FileNotFoundError:
        return {}, {}


def main():
    print("=" * 60)
    print("Neon -> Supabase Migration (Resume Mode)")
    print("=" * 60)

    session = create_session_with_retries()

    # Neon接続
    print("\n1. Connecting to Neon...")
    neon_conn = get_neon_connection()
    neon_cursor = neon_conn.cursor()

    # 既存マッピングを読み込み or Supabaseから復元
    print("\n2. Loading/Restoring mappings...")
    user_id_mapping, deck_id_mapping = load_mapping()

    if not user_id_mapping:
        print("   No saved mapping found, fetching from Supabase...")
        user_id_mapping = fetch_existing_user_mapping(session)

    print(f"   User mapping: {len(user_id_mapping)} entries")
    print(f"   Deck mapping: {len(deck_id_mapping)} entries")

    # 既存デッキを取得して重複チェック用のセットを作成
    existing_decks = fetch_existing_deck_mapping(session)
    existing_deck_keys = set()
    for d in existing_decks:
        key = (d["user_id"], d["name"], d["is_opponent"])
        existing_deck_keys.add(key)

    # Neonからデッキを取得
    print("\n3. Fetching decks from Neon...")
    neon_cursor.execute("""
        SELECT id, user_id, name, is_opponent, active, createdat, updatedat
        FROM decks ORDER BY id
    """)
    neon_decks = neon_cursor.fetchall()
    print(f"   Found {len(neon_decks)} decks in Neon")

    # デッキ移行（スキップ済みを考慮）
    print("\n4. Migrating remaining decks...")
    new_deck_count = 0
    skipped_count = 0

    for i, deck in enumerate(neon_decks):
        user_uuid = user_id_mapping.get(deck["user_id"])
        if not user_uuid:
            skipped_count += 1
            continue

        # 既にマッピング済み
        if deck["id"] in deck_id_mapping:
            skipped_count += 1
            continue

        # Supabaseに既に存在するか確認
        key = (user_uuid, deck["name"], deck["is_opponent"])
        if key in existing_deck_keys:
            # 既存デッキのIDを探す
            for ed in existing_decks:
                if (ed["user_id"], ed["name"], ed["is_opponent"]) == key:
                    deck_id_mapping[deck["id"]] = ed["id"]
                    break
            skipped_count += 1
            continue

        # 新規挿入
        new_id = insert_deck_with_retry(session, user_uuid, deck)
        if new_id:
            deck_id_mapping[deck["id"]] = new_id
            new_deck_count += 1
            existing_deck_keys.add(key)

        if (i + 1) % 100 == 0:
            print(f"   Processed {i + 1}/{len(neon_decks)} decks (new: {new_deck_count}, skipped: {skipped_count})")
            save_mapping(user_id_mapping, deck_id_mapping)
            time.sleep(BATCH_DELAY)

    print(f"   Completed: {new_deck_count} new decks, {skipped_count} skipped")
    save_mapping(user_id_mapping, deck_id_mapping)

    # 対戦履歴を取得
    print("\n5. Fetching duels from Neon...")
    neon_cursor.execute("""
        SELECT id, user_id, deck_id, opponent_deck_id,
               is_win, game_mode, rank, rate_value, dc_value,
               won_coin_toss, is_going_first, played_date, notes,
               create_date, update_date
        FROM duels ORDER BY id
    """)
    neon_duels = neon_cursor.fetchall()
    print(f"   Found {len(neon_duels)} duels in Neon")

    # 既存のduel数を確認
    print("\n6. Checking existing duels in Supabase...")
    headers = get_headers()
    response = session.get(
        f"{SUPABASE_URL}/rest/v1/duels",
        headers=headers,
        params={"select": "count", "head": "true"}
    )
    # Prefer: count=exact が必要
    headers_count = get_headers()
    headers_count["Prefer"] = "count=exact"
    response = session.head(
        f"{SUPABASE_URL}/rest/v1/duels",
        headers=headers_count
    )
    existing_duel_count = int(response.headers.get("content-range", "0/0").split("/")[-1])
    print(f"   Existing duels in Supabase: {existing_duel_count}")

    # 対戦履歴移行
    print("\n7. Migrating duels...")
    migrated_duels = 0
    failed_duels = 0

    for i, duel in enumerate(neon_duels):
        user_uuid = user_id_mapping.get(duel["user_id"])
        if not user_uuid:
            failed_duels += 1
            continue

        if insert_duel_with_retry(session, user_uuid, duel, deck_id_mapping):
            migrated_duels += 1
        else:
            failed_duels += 1

        if (i + 1) % 500 == 0:
            print(f"   Processed {i + 1}/{len(neon_duels)} duels (success: {migrated_duels}, failed: {failed_duels})")
            time.sleep(BATCH_DELAY)

    print(f"   Completed: {migrated_duels} duels migrated, {failed_duels} failed")

    # 最終マッピング保存
    print("\n8. Saving final mapping...")
    save_mapping(user_id_mapping, deck_id_mapping)

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
