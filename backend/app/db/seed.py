import logging
import os
import random

# プロジェクトのルートパスをsys.pathに追加
import sys
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from faker import Faker
from sqlalchemy.orm import Session

sys.path.append(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

from app.db.session import SessionLocal
from app.schemas.duel import DuelCreate
from app.schemas.user import UserCreate
from app.services.deck_service import deck_service
from app.services.duel_service import duel_service
from app.services.user_service import user_service

# ロギング設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

fake = Faker("ja_JP")


def seed_data(db: Session):
    """ダミーデータをデータベースに投入する"""
    # JSTタイムゾーン設定
    jst = ZoneInfo("Asia/Tokyo")

    try:
        # --- 1. 固定ユーザーの取得または作成 ---
        logger.info("Getting or creating a fixed user...")
        password = "password123"
        fixed_email = "test@example.com"
        fixed_username = "testuser"

        user = (
            db.query(user_service.model)
            .filter(user_service.model.email == fixed_email)
            .first()
        )
        if user:
            logger.info(f"User '{user.username}' already exists.")
        else:
            user_in = UserCreate(
                username=fixed_username, email=fixed_email, password=password
            )
            user = user_service.create(db, obj_in=user_in)
            logger.info(f"User '{user.username}' created.")

        # --- 2. ダミーデッキの作成 (自分用と相手用) ---
        logger.info("Creating dummy decks...")
        my_decks = []
        opponent_decks = []
        deck_names = set()

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
        logger.info("Creating dummy duels: 300 for each game mode...")
        total_created_count = 0
        now = datetime.now(jst)  # JSTタイムゾーン付きの現在時刻
        game_modes = ["RANK", "RATE", "EVENT", "DC"]

        for mode in game_modes:
            logger.info(
                f"  Creating 300 duels for '{mode}' mode over the last 3 months..."
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
                        duel_data["dc_value"] = round(random.uniform(200.0, 400.0), 2)

                    duel_in = DuelCreate(**duel_data)
                    duel_service.create_user_duel(db, user_id=user.id, duel_in=duel_in)
                    total_created_count += 1

        logger.info(f"{total_created_count} duels created in total.")
        logger.info("\n" + "=" * 50)
        logger.info("✅ Dummy data seeding complete!")
        # メールアドレスは test@example.com などのダミーデータなのでマスキング
        logger.info(f"  Login with Email: {fixed_email[0]}***@example.com")
        # 機密情報（パスワード）はログに出力しない
        logger.info("=" * 50)

    except Exception as e:
        logger.error(f"An error occurred during data seeding: {e}", exc_info=True)
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    logger.info("Initializing database...")
    from app.db.session import engine
    from app.models import Base

    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created.")

    logger.info("Starting data seeding process...")
    db_session = SessionLocal()
    seed_data(db_session)
    logger.info("Data seeding process finished.")
