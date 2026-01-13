"""
Neon から Supabase への対戦履歴移行スクリプト
"""

import os
import json
import time
import requests
from datetime import datetime
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# 設定
SUPABASE_URL = "https://vdzyixwbikouwkhvvwkn.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkenlpeHdiaWtvdXdraHZ2d2tuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODI2NjA4NywiZXhwIjoyMDgzODQyMDg3fQ.EkGeVdz_ziYOOvi8iRhqbsILdHWJ4KPUetH4L42T8rY"

# Neon接続情報
NEON_DATABASE_URL = "postgresql://neondb_owner:npg_B4aOreSJ1hwR@ep-summer-union-a182z2hw-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

# バッチ設定
BATCH_SIZE = 500
BATCH_DELAY = 0.5  # 秒

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


def load_mapping(filename="migration_mapping.json"):
    """マッピングを読み込み"""
    with open(filename, "r") as f:
        mapping = json.load(f)
    return (
        {int(k): v for k, v in mapping.get("users", {}).items()},
        {int(k): v for k, v in mapping.get("decks", {}).items()}
    )


def get_existing_duel_count(session):
    """既存のduel数を取得"""
    headers = get_headers()
    headers["Prefer"] = "count=exact"
    response = session.head(
        f"{SUPABASE_URL}/rest/v1/duels",
        headers=headers
    )
    content_range = response.headers.get("content-range", "0/0")
    return int(content_range.split("/")[-1])


def insert_duels_batch(session, duels_data, max_retries=3):
    """複数の対戦履歴を一括挿入"""
    headers = get_headers()
    url = f"{SUPABASE_URL}/rest/v1/duels"

    for attempt in range(max_retries):
        try:
            response = session.post(url, headers=headers, json=duels_data, timeout=60)

            if response.status_code == 201:
                return len(duels_data)
            elif response.status_code == 409:
                # 一部が既存の場合、1件ずつ挿入を試行
                success = 0
                for duel in duels_data:
                    try:
                        r = session.post(url, headers=headers, json=duel, timeout=30)
                        if r.status_code in [201, 409]:
                            success += 1
                    except:
                        pass
                return success
            else:
                print(f"Batch insert error (attempt {attempt + 1}): {response.status_code}")

        except Exception as e:
            print(f"Exception in batch insert (attempt {attempt + 1}): {e}")

        time.sleep(2 ** attempt)

    return 0


def main():
    print("=" * 60)
    print("Neon -> Supabase Duels Migration")
    print("=" * 60)

    session = create_session_with_retries()

    # マッピング読み込み
    print("\n1. Loading mappings...")
    user_id_mapping, deck_id_mapping = load_mapping()
    print(f"   User mapping: {len(user_id_mapping)} entries")
    print(f"   Deck mapping: {len(deck_id_mapping)} entries")

    # 既存のduel数を確認
    existing_count = get_existing_duel_count(session)
    print(f"   Existing duels in Supabase: {existing_count}")

    # Neon接続
    print("\n2. Connecting to Neon...")
    neon_conn = get_neon_connection()
    neon_cursor = neon_conn.cursor()

    # 対戦履歴を取得
    print("\n3. Fetching duels from Neon...")
    neon_cursor.execute("""
        SELECT id, user_id, deck_id, opponent_deck_id,
               is_win, game_mode, rank, rate_value, dc_value,
               won_coin_toss, is_going_first, played_date, notes,
               create_date, update_date
        FROM duels ORDER BY id
    """)
    neon_duels = neon_cursor.fetchall()
    print(f"   Found {len(neon_duels)} duels in Neon")

    neon_cursor.close()
    neon_conn.close()

    # 対戦履歴移行
    print("\n4. Migrating duels...")
    migrated_duels = 0
    skipped_duels = 0
    batch = []

    for i, duel in enumerate(neon_duels):
        user_uuid = user_id_mapping.get(duel["user_id"])
        new_deck_id = deck_id_mapping.get(duel["deck_id"])
        new_opponent_deck_id = deck_id_mapping.get(duel["opponent_deck_id"])

        if not all([user_uuid, new_deck_id, new_opponent_deck_id]):
            skipped_duels += 1
            continue

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
        batch.append(data)

        if len(batch) >= BATCH_SIZE:
            count = insert_duels_batch(session, batch)
            migrated_duels += count
            batch = []

            if (i + 1) % 5000 == 0:
                print(f"   Processed {i + 1}/{len(neon_duels)} duels (migrated: {migrated_duels}, skipped: {skipped_duels})")

            time.sleep(BATCH_DELAY)

    # 残りのバッチを処理
    if batch:
        count = insert_duels_batch(session, batch)
        migrated_duels += count

    print(f"\n   Completed: {migrated_duels} duels migrated, {skipped_duels} skipped")

    # 最終確認
    final_count = get_existing_duel_count(session)
    print(f"\n5. Final verification:")
    print(f"   Duels in Supabase: {final_count}")

    print("\n" + "=" * 60)
    print("Duels migration completed!")
    print("=" * 60)


if __name__ == "__main__":
    main()
