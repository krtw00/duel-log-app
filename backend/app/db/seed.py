"""
ダミーデータ生成スクリプト（Supabase Auth対応版）

Supabase Admin APIを使用してユーザーを作成し、
ローカルDBにも同期してダミーデータを投入します。

デッキ名はygo-grimoireから取得した遊戯王テーマを使用し、
備考は実際のプレイヤーが書くような自然な文章を生成します。
"""

import json
import logging
import os
import random
import sys
from datetime import datetime, timedelta
from pathlib import Path
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

# プロジェクトルートパス
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent

# テーマデータのパス
THEMES_JSON_PATH = PROJECT_ROOT / "scripts" / "data" / "ygo-themes.json"


def load_ygo_themes() -> list[str]:
    """
    ygo-themes.jsonからテーマ名を読み込む

    Returns:
        テーマ名のリスト
    """
    try:
        with open(THEMES_JSON_PATH, "r", encoding="utf-8") as f:
            themes = json.load(f)
            return [theme["name"] for theme in themes]
    except FileNotFoundError:
        logger.warning(f"Themes file not found: {THEMES_JSON_PATH}")
        logger.warning("Using fallback theme names")
        return [
            "スネークアイ",
            "炎王",
            "ユベル",
            "粛声",
            "天盃龍",
            "ラビュリンス",
            "神碑",
            "烙印",
            "ティアラメンツ",
            "クシャトリラ",
        ]
    except Exception as e:
        logger.error(f"Failed to load themes: {e}")
        return ["テーマA", "テーマB", "テーマC", "テーマD", "テーマE"]


# 人間らしい備考テンプレート（勝ち用）
WIN_NOTES = [
    "相手事故って助かった",
    "完封勝ち！気持ちいい",
    "先攻展開で制圧できた",
    "後手捲り成功",
    "ニビル刺さった",
    "うらら通ってよかった",
    "相手の妨害全部踏み抜いた",
    "接戦だったけどなんとか勝ち",
    "手札良すぎて楽勝だった",
    "相手投了",
    "最後のドローで引いた！",
    "相手のミスに助けられた",
    "サイチェン上手くいった",
    "読み合い勝ち",
    "展開通って気持ちよかった",
    "Gツッパして勝った",
    "誘発全部握ってた",
    "トップ解決",
    "相手泡吹いてた",
    "危なかったけど勝ち",
    "ワンキル決まった",
    "リソース勝ち",
    "相手デッキ切れ",
    "長期戦になったけど勝った",
    "妨害足りてた",
    None,  # 空欄
    None,
    None,
]

# 人間らしい備考テンプレート（負け用）
LOSE_NOTES = [
    "手札誘発全部通されて何もできなかった",
    "先攻取られて無理だった",
    "事故った...",
    "妨害足りなかった",
    "タイムアップ負け",
    "後手捲れなかった",
    "相手の展開止められず",
    "読み負け",
    "サイチェン失敗した",
    "Gで止まれなかった",
    "誘発引けなかった",
    "プレミした...",
    "相手上手すぎ",
    "デッキ相性最悪",
    "何しても無理だった",
    "ニビル打たれて終わり",
    "うらら食らって動けず",
    "ドロバ刺さった",
    "相手完璧だった",
    "手札終わってた",
    "リソース切れ",
    "長考しすぎた",
    "最後まで粘ったけどダメだった",
    "接戦だったのに...",
    "ワンキルされた",
    None,  # 空欄
    None,
    None,
]

# イベント用の備考
EVENT_NOTES = [
    "イベント周回中",
    "イベント消化",
    "ポイント稼ぎ",
    "イベント報酬目当て",
    "称号狙い",
    None,
]


def generate_note(is_win: bool, game_mode: str) -> str | None:
    """
    勝敗とゲームモードに応じた自然な備考を生成

    Args:
        is_win: 勝ったかどうか
        game_mode: ゲームモード

    Returns:
        備考文字列またはNone
    """
    # イベントモードは専用の備考
    if game_mode == "EVENT":
        return random.choice(EVENT_NOTES)

    # 50%の確率で備考なし
    if random.random() < 0.5:
        return None

    # 勝敗に応じた備考を選択
    notes = WIN_NOTES if is_win else LOSE_NOTES
    return random.choice(notes)


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
                logger.info(
                    f"✅ Supabase user created: {email} (UUID: {supabase_uuid})"
                )
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
    db: Session,
    supabase_uuid: str,
    email: str,
    username: str,
    is_admin: bool = False,
    is_debugger: bool = False,
) -> User:
    """
    ローカルDBでユーザーを取得または作成

    Args:
        db: データベースセッション
        supabase_uuid: SupabaseのユーザーUUID
        email: メールアドレス
        username: ユーザー名
        is_admin: 管理者権限
        is_debugger: デバッガー権限

    Returns:
        ユーザーオブジェクト
    """
    # まずsupabase_uuidで検索
    user = db.query(User).filter(User.supabase_uuid == supabase_uuid).first()
    if user:
        # 既存ユーザーの権限を更新
        updated = False
        if is_admin and not user.is_admin:
            user.is_admin = True
            updated = True
        if is_debugger and not user.is_debugger:
            user.is_debugger = True
            updated = True
        if updated:
            db.commit()
            db.refresh(user)
            logger.info(f"Updated privileges for: {user.username}")
        logger.info(f"Found existing user by supabase_uuid: {user.username}")
        return user

    # 次にメールアドレスで検索
    user = db.query(User).filter(User.email == email).first()
    if user:
        # 既存ユーザーにsupabase_uuidを紐付け + 権限更新
        user.supabase_uuid = supabase_uuid
        if is_admin:
            user.is_admin = True
        if is_debugger:
            user.is_debugger = True
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
        is_admin=is_admin,
        is_debugger=is_debugger,
        enable_screen_analysis=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    logger.info(f"Created new local user: {user.username}")
    return user


# シードユーザー定義
SEED_USERS = [
    {
        "email": "test@example.com",
        "username": "testuser",
        "is_admin": True,
        "is_debugger": True,
        "create_duels": True,  # このユーザーのみダミー対戦データを作成
    },
    {
        "email": "admin@example.com",
        "username": "admin",
        "is_admin": True,
        "is_debugger": False,
        "create_duels": False,
    },
    {
        "email": "debugger@example.com",
        "username": "debugger",
        "is_admin": False,
        "is_debugger": True,
        "create_duels": False,
    },
]


def seed_data(db: Session, skip_supabase: bool = False):
    """ダミーデータをデータベースに投入する

    Args:
        db: データベースセッション
        skip_supabase: Trueの場合、Supabase AuthをスキップしてローカルDBのみ使用
    """
    # JSTタイムゾーン設定
    jst = ZoneInfo("Asia/Tokyo")
    password = "password123"

    try:
        # --- 1. ユーザーを作成 ---
        if skip_supabase:
            logger.info("Creating users (local DB only, skipping Supabase Auth)...")
        else:
            logger.info("Creating users via Supabase Auth...")

        created_users = []
        main_user = None  # ダミーデータを作成するメインユーザー

        for user_config in SEED_USERS:
            email = user_config["email"]
            username = user_config["username"]

            supabase_uuid = None

            if not skip_supabase:
                # Supabaseにユーザーを作成
                supabase_uuid = create_supabase_user(email, password, username)

                if not supabase_uuid:
                    logger.warning(
                        f"⚠️ Failed to create Supabase user: {email}, falling back to local only"
                    )

            # supabase_uuidがない場合はダミーUUIDを生成
            if not supabase_uuid:
                import uuid

                supabase_uuid = str(uuid.uuid4())
                logger.info(f"Using generated UUID for {email}: {supabase_uuid}")

            # ローカルDBにユーザーを同期
            user = get_or_create_local_user(
                db,
                supabase_uuid,
                email,
                username,
                is_admin=user_config["is_admin"],
                is_debugger=user_config["is_debugger"],
            )
            created_users.append(
                {
                    "user": user,
                    "email": email,
                    "supabase_uuid": supabase_uuid,
                    "config": user_config,
                }
            )
            logger.info(
                f"User ready: {user.username} (ID: {user.id}, admin={user.is_admin}, debugger={user.is_debugger})"
            )

            # メインユーザーを特定
            if user_config.get("create_duels"):
                main_user = user

        if not main_user:
            logger.error("❌ No main user found for creating duels. Aborting seed.")
            return

        user = main_user  # 後続処理用

        # --- 2. ダミーデッキの作成 (自分用と相手用) ---
        logger.info("Creating dummy decks from YGO themes...")

        # テーマ名を読み込み
        all_themes = load_ygo_themes()
        logger.info(f"Loaded {len(all_themes)} themes from ygo-grimoire")

        # ランダムにシャッフルしてデッキ名を選択
        random.shuffle(all_themes)

        my_decks = []
        opponent_decks = []

        # 自分用デッキ: 5個（人気テーマを想定）
        my_deck_names = all_themes[:5]
        # 相手用デッキ: 20個（対戦相手の多様性を表現）
        opponent_deck_names = all_themes[5:25]

        for name in my_deck_names:
            my_deck = deck_service.get_or_create(
                db, user_id=user.id, name=name, is_opponent=False
            )
            my_decks.append(my_deck)

        for name in opponent_deck_names:
            opponent_deck = deck_service.get_or_create(
                db, user_id=user.id, name=name, is_opponent=True
            )
            opponent_decks.append(opponent_deck)

        logger.info(
            f"{len(my_decks)} own decks and {len(opponent_decks)} opponent decks created."
        )
        logger.info(f"  My decks: {[d.name for d in my_decks]}")

        # --- 3. ダミーデュエルの作成 (各モード300戦ずつ) ---
        logger.info("Creating dummy duels: 900 for each game mode (last 3 months)...")
        total_created_count = 0
        now = datetime.now(jst)  # JSTタイムゾーン付きの現在時刻
        period_start = now - timedelta(days=92)
        game_modes = ["RANK", "RATE", "EVENT", "DC"]

        # レート/DC値の初期値（モードごとに継続して使用）
        current_rate = 1500.0  # レートは1500スタート
        current_dc = 0  # DCは0スタート

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
                        "notes": generate_note(result, mode),
                        "rank": None,
                        "rate_value": None,
                        "dc_value": None,
                    }

                    if mode == "RANK":
                        duel_data["rank"] = random.randint(1, 32)

                    elif mode == "RATE":
                        # レート: 1500スタート、最低1200、増減は1桁
                        change = random.randint(1, 9)
                        if result:  # 勝ち
                            current_rate = current_rate + change
                        else:  # 負け
                            current_rate = max(1200.0, current_rate - change)
                        duel_data["rate_value"] = round(current_rate, 2)

                    elif mode == "EVENT":
                        # EVENTモードの備考はgenerate_noteで生成済み
                        pass

                    elif mode == "DC":
                        # DC: 0スタート、勝ちで+1000
                        # 負けは1万未満なら1000以下、1万以上でも1000付近
                        if result:  # 勝ち
                            current_dc = current_dc + 1000
                        else:  # 負け
                            if current_dc < 10000:
                                # 1万未満は100〜1000の下がり幅
                                loss = random.randint(100, 1000)
                            else:
                                # 1万以上でも1000付近（900〜1200程度）
                                loss = random.randint(900, 1200)
                            current_dc = max(0, current_dc - loss)
                        duel_data["dc_value"] = current_dc

                    duel_in = DuelCreate(**duel_data)  # type: ignore[arg-type]
                    duel_service.create_user_duel(db, user_id=user.id, duel_in=duel_in)
                    total_created_count += 1

        logger.info(f"{total_created_count} duels created in total.")
        # 開発用シードの認証情報は標準出力に表示（ログには記録しない）
        print("\n" + "=" * 60)
        print("✅ Dummy data seeding complete!")
        print("=" * 60)
        print(f"\nPassword (all users): {password}\n")
        print("Created users:")
        print("-" * 60)
        for u in created_users:
            admin_flag = "👑" if u["config"]["is_admin"] else "  "
            debug_flag = "🔧" if u["config"]["is_debugger"] else "  "
            print(f"  {admin_flag}{debug_flag} {u['email']:<30} ({u['user'].username})")
        print("-" * 60)
        print("  👑 = admin, 🔧 = debugger")
        print("=" * 60)

    except Exception as e:
        logger.error(f"An error occurred during data seeding: {e}", exc_info=True)
        db.rollback()
    finally:
        db.close()


def clean_seed_data(db: Session):
    """
    シードデータを削除（Supabase Authからも削除）
    """
    try:
        for user_config in SEED_USERS:
            email = user_config["email"]
            # ローカルDBからユーザーを検索
            user = db.query(User).filter(User.email == email).first()

            if user:
                supabase_uuid = user.supabase_uuid

                # Supabaseからユーザーを削除
                if supabase_uuid:
                    delete_supabase_user(supabase_uuid)

                # ローカルDBからユーザーを削除（カスケードでデッキとデュエルも削除）
                db.delete(user)
                db.commit()
                logger.info(f"✅ Cleaned up seed data for {email}")
            else:
                logger.info(f"No seed data found for {email}")

    except Exception as e:
        logger.error(f"Error cleaning seed data: {e}", exc_info=True)
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Seed dummy data")
    parser.add_argument(
        "--clean", action="store_true", help="Clean up seed data instead of creating"
    )
    parser.add_argument(
        "--skip-supabase",
        action="store_true",
        help="Skip Supabase Auth and use local DB only (for Docker dev environment)",
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
        seed_data(db_session, skip_supabase=args.skip_supabase)

    logger.info("Process finished.")
