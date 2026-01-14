"""
ダミーデータ生成スクリプト（Supabase Auth対応版）

Supabase Admin APIを使用してユーザーを作成し、
ローカルDBにも同期してダミーデータを投入します。
"""

import logging
import os
import random
import sys
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import httpx
from faker import Faker
from sqlalchemy.orm import Session

# プロジェクトのルートパスをsys.pathに追加
sys.path.append(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

from app.db.session import SessionLocal
from app.models.user import User
from app.schemas.duel import DuelCreate
from app.services.deck_service import deck_service
from app.services.duel_service import duel_service

# ロギング設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

fake = Faker("ja_JP")

# ローカルSupabase設定
SUPABASE_URL = os.getenv("SUPABASE_URL", "http://127.0.0.1:55321")
# ローカルSupabaseのデフォルトservice_roleキー
SUPABASE_SERVICE_ROLE_KEY = os.getenv(
    "SUPABASE_SERVICE_ROLE_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU",
)


def create_supabase_user(email: str, password: str, username: str) -> str | None:
    """
    Supabase Admin APIを使用してユーザーを作成

    Args:
        email: メールアドレス
        password: パスワード
        username: ユーザー名

    Returns:
        作成されたユーザーのUUID、失敗時はNone
    """
    url = f"{SUPABASE_URL}/auth/v1/admin/users"
    headers = {
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Content-Type": "application/json",
    }
    payload = {
        "email": email,
        "password": password,
        "email_confirm": True,  # メール確認済みとしてマーク
        "user_metadata": {"username": username},
    }

    try:
        with httpx.Client() as client:
            response = client.post(url, json=payload, headers=headers)

            if response.status_code == 200:
                user_data = response.json()
                supabase_uuid = user_data.get("id")
                logger.info(f"✅ Supabase user created: {email} (UUID: {supabase_uuid})")
                return supabase_uuid
            elif response.status_code == 422:
                # ユーザーが既に存在する場合、既存ユーザーを取得
                logger.info(f"User {email} already exists in Supabase, fetching...")
                return get_supabase_user_by_email(email)
            else:
                logger.error(
                    f"❌ Failed to create Supabase user: {response.status_code} - {response.text}"
                )
                return None
    except Exception as e:
        logger.error(f"❌ Error creating Supabase user: {e}")
        return None


def get_supabase_user_by_email(email: str) -> str | None:
    """
    メールアドレスでSupabaseユーザーを検索

    Args:
        email: メールアドレス

    Returns:
        ユーザーのUUID、見つからない場合はNone
    """
    # Admin API: list users with filter
    url = f"{SUPABASE_URL}/auth/v1/admin/users"
    headers = {
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
    }

    try:
        with httpx.Client() as client:
            response = client.get(url, headers=headers)

            if response.status_code == 200:
                data = response.json()
                users = data.get("users", [])
                for user in users:
                    if user.get("email") == email:
                        return user.get("id")
            logger.warning(f"User {email} not found in Supabase")
            return None
    except Exception as e:
        logger.error(f"❌ Error fetching Supabase user: {e}")
        return None


def delete_supabase_user(supabase_uuid: str) -> bool:
    """
    Supabase Admin APIを使用してユーザーを削除

    Args:
        supabase_uuid: 削除するユーザーのUUID

    Returns:
        削除成功時True
    """
    url = f"{SUPABASE_URL}/auth/v1/admin/users/{supabase_uuid}"
    headers = {
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
    }

    try:
        with httpx.Client() as client:
            response = client.delete(url, headers=headers)
            if response.status_code == 200:
                logger.info(f"✅ Supabase user deleted: {supabase_uuid}")
                return True
            else:
                logger.error(
                    f"❌ Failed to delete Supabase user: {response.status_code}"
                )
                return False
    except Exception as e:
        logger.error(f"❌ Error deleting Supabase user: {e}")
        return False


def get_or_create_local_user(
    db: Session, supabase_uuid: str, email: str, username: str
) -> User:
    """
    ローカルDBでユーザーを取得または作成

    Args:
        db: データベースセッション
        supabase_uuid: SupabaseのユーザーUUID
        email: メールアドレス
        username: ユーザー名

    Returns:
        ユーザーオブジェクト
    """
    # まずsupabase_uuidで検索
    user = db.query(User).filter(User.supabase_uuid == supabase_uuid).first()
    if user:
        logger.info(f"Found existing user by supabase_uuid: {user.username}")
        return user

    # 次にメールアドレスで検索
    user = db.query(User).filter(User.email == email).first()
    if user:
        # 既存ユーザーにsupabase_uuidを紐付け
        user.supabase_uuid = supabase_uuid
        db.commit()
        db.refresh(user)
        logger.info(f"Linked existing user to Supabase: {user.username}")
        return user

    # 新規作成
    user = User(
        supabase_uuid=supabase_uuid,
        username=username,
        email=email,
        passwordhash="supabase_auth_user",  # Supabase認証ユーザーを示すマーカー
        streamer_mode=False,
        theme_preference="dark",
        is_admin=False,
        enable_screen_analysis=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    logger.info(f"Created new local user: {user.username}")
    return user


def seed_data(db: Session):
    """ダミーデータをデータベースに投入する"""
    # JSTタイムゾーン設定
    jst = ZoneInfo("Asia/Tokyo")

    try:
        # --- 1. Supabase Authでユーザーを作成 ---
        logger.info("Creating user via Supabase Auth...")
        password = "password123"
        fixed_email = "test@example.com"
        fixed_username = "testuser"

        # Supabaseにユーザーを作成
        supabase_uuid = create_supabase_user(fixed_email, password, fixed_username)

        if not supabase_uuid:
            logger.error("❌ Failed to create/get Supabase user. Aborting seed.")
            return

        # ローカルDBにユーザーを同期
        user = get_or_create_local_user(db, supabase_uuid, fixed_email, fixed_username)
        logger.info(f"User ready: {user.username} (ID: {user.id}, UUID: {supabase_uuid})")

        # --- 2. ダミーデッキの作成 (自分用と相手用) ---
        logger.info("Creating dummy decks...")
        my_decks = []
        opponent_decks = []
        deck_names: set[str] = set()

        while len(deck_names) < 10:
            deck_names.add(fake.word().capitalize() + " " + fake.word().capitalize())

        deck_name_list = list(deck_names)

        for i in range(5):
            my_deck = deck_service.get_or_create(
                db, user_id=user.id, name=deck_name_list[i], is_opponent=False
            )
            my_decks.append(my_deck)
            opponent_deck = deck_service.get_or_create(
                db, user_id=user.id, name=deck_name_list[i + 5], is_opponent=True
            )
            opponent_decks.append(opponent_deck)

        logger.info(
            f"{len(my_decks)} own decks and {len(opponent_decks)} opponent decks created."
        )

        # --- 3. ダミーデュエルの作成 (各モード300戦ずつ) ---
        logger.info("Creating dummy duels: 900 for each game mode (last 3 months)...")
        total_created_count = 0
        now = datetime.now(jst)  # JSTタイムゾーン付きの現在時刻
        period_start = now - timedelta(days=92)
        game_modes = ["RANK", "RATE", "EVENT", "DC"]

        for mode in game_modes:
            existing_duels_count = (
                db.query(duel_service.model)
                .filter(
                    duel_service.model.user_id == user.id,
                    duel_service.model.game_mode == mode,
                    duel_service.model.played_date >= period_start,
                )
                .count()
            )
            if existing_duels_count > 0:
                logger.info(
                    f"  Skipping '{mode}' mode: {existing_duels_count} duels already exist (>= {period_start:%Y-%m-%d})."
                )
                continue

            logger.info(
                f"  Creating 900 duels for '{mode}' mode over the last 3 months..."
            )

            # 各月300戦ずつ作成（3ヶ月で合計900戦）
            duels_per_month_per_mode = 300
            for month_index in range(3):
                # --- 期間の計算 (JSTタイムゾーン付き) ---
                first_day_of_current_month = now.replace(
                    day=1, hour=0, minute=0, second=0, microsecond=0
                )
                if month_index > 0:
                    temp_date = first_day_of_current_month
                    for _ in range(month_index):
                        last_day_of_prev_month = temp_date - timedelta(days=1)
                        temp_date = last_day_of_prev_month.replace(day=1)
                    start_date_month = temp_date
                else:
                    start_date_month = first_day_of_current_month

                if start_date_month.month == 12:
                    end_date_month = start_date_month.replace(
                        year=start_date_month.year + 1, month=1, day=1
                    ) - timedelta(seconds=1)
                else:
                    end_date_month = start_date_month.replace(
                        month=start_date_month.month + 1, day=1
                    ) - timedelta(seconds=1)

                if month_index == 0:
                    end_date_month = now

                for _ in range(duels_per_month_per_mode):
                    my_deck = random.choice(my_decks)
                    opponent_deck = random.choice(opponent_decks)
                    result = random.choice([True, False])

                    # ナイーブなdatetimeを生成してJSTタイムゾーンを付与
                    naive_datetime = fake.date_time_between_dates(
                        datetime_start=start_date_month.replace(tzinfo=None),
                        datetime_end=end_date_month.replace(tzinfo=None),
                    )
                    played_date_jst = naive_datetime.replace(tzinfo=jst)

                    duel_data = {
                        "deck_id": my_deck.id,
                        "opponent_deck_id": opponent_deck.id,
                        "won_coin_toss": random.choice([True, False]),
                        "is_going_first": random.choice([True, False]),
                        "is_win": result,
                        "game_mode": mode,
                        "played_date": played_date_jst,
                        "notes": fake.sentence() if random.random() > 0.5 else None,
                        "rank": None,
                        "rate_value": None,
                        "dc_value": None,
                    }

                    if mode == "RANK":
                        duel_data["rank"] = random.randint(1, 32)

                    elif mode == "RATE":
                        duel_data["rate_value"] = round(random.uniform(200.0, 400.0), 2)

                    elif mode == "EVENT":
                        duel_data["notes"] = "イベント300"

                    elif mode == "DC":
                        duel_data["dc_value"] = random.randint(200, 400)

                    duel_in = DuelCreate(**duel_data)  # type: ignore[arg-type]
                    duel_service.create_user_duel(db, user_id=user.id, duel_in=duel_in)
                    total_created_count += 1

        logger.info(f"{total_created_count} duels created in total.")
        logger.info("\n" + "=" * 50)
        logger.info("✅ Dummy data seeding complete!")
        logger.info(f"  Email: {fixed_email}")
        logger.info(f"  Password: {password}")
        logger.info(f"  Supabase UUID: {supabase_uuid}")
        logger.info("=" * 50)

    except Exception as e:
        logger.error(f"An error occurred during data seeding: {e}", exc_info=True)
        db.rollback()
    finally:
        db.close()


def clean_seed_data(db: Session):
    """
    シードデータを削除（Supabase Authからも削除）
    """
    fixed_email = "test@example.com"

    try:
        # ローカルDBからユーザーを検索
        user = db.query(User).filter(User.email == fixed_email).first()

        if user:
            supabase_uuid = user.supabase_uuid

            # Supabaseからユーザーを削除
            if supabase_uuid:
                delete_supabase_user(supabase_uuid)

            # ローカルDBからユーザーを削除（カスケードでデッキとデュエルも削除）
            db.delete(user)
            db.commit()
            logger.info(f"✅ Cleaned up seed data for {fixed_email}")
        else:
            logger.info(f"No seed data found for {fixed_email}")

    except Exception as e:
        logger.error(f"Error cleaning seed data: {e}", exc_info=True)
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Seed dummy data with Supabase Auth")
    parser.add_argument(
        "--clean", action="store_true", help="Clean up seed data instead of creating"
    )
    args = parser.parse_args()

    logger.info("Initializing database...")
    from app.db.session import engine
    from app.models import Base

    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created.")

    db_session = SessionLocal()

    if args.clean:
        logger.info("Starting cleanup process...")
        clean_seed_data(db_session)
    else:
        logger.info("Starting data seeding process...")
        seed_data(db_session)

    logger.info("Process finished.")
