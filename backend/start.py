#!/usr/bin/env python3
"""
データベース接続待機とマイグレーション実行スクリプト
"""

import logging
import os
import subprocess
import sys
import time
from urllib.parse import unquote, urlparse

import psycopg

# ログ設定（標準出力に確実に出力）
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
    force=True,
)
logger = logging.getLogger(__name__)


def wait_for_db(max_attempts=60):
    """データベース接続を待機"""
    dsn_url = os.getenv("DATABASE_URL")
    if not dsn_url:
        # フォールバック：個別の環境変数を使用
        dsn_url = f"postgresql://{os.getenv('POSTGRES_USER')}:{os.getenv('POSTGRES_PASSWORD')}@{os.getenv('POSTGRES_HOST', 'db')}/{os.getenv('POSTGRES_DB')}"

    logger.info(f"Full Database DSN: {dsn_url}")
    logger.info(
        f"Database URL: {dsn_url.split('@')[1] if '@' in dsn_url else 'unknown'}"
    )

    # SQLiteの場合は待機をスキップ
    if dsn_url.startswith("sqlite"):
        logger.info("✅ Using SQLite database (no connection wait required)")
        sys.stdout.flush()
        return True

    logger.info("⏳ Waiting for database connection...")
    sys.stdout.flush()

    # DSN URLをパースしてキーワード引数に変換
    parsed_url = urlparse(dsn_url)
    conn_params = {
        "host": parsed_url.hostname,
        "port": parsed_url.port,
        "user": parsed_url.username,
        "password": (
            unquote(parsed_url.password) if parsed_url.password else None
        ),  # URLエンコードされたパスワードをデコード
        "dbname": parsed_url.path.lstrip("/"),
    }

    # NeonDB用のSSL設定（sslmodeパラメータがある場合）
    if "sslmode=require" in dsn_url:
        conn_params["sslmode"] = "require"

    for attempt in range(1, max_attempts + 1):
        try:
            # キーワード引数で接続を試みる
            with psycopg.connect(**conn_params, connect_timeout=1) as _:
                logger.info("✅ Database is ready!")
                sys.stdout.flush()
                return True
        except psycopg.OperationalError as e:
            if attempt % 10 == 0:  # 10回ごとにログ出力
                logger.info(
                    f"⏳ Waiting for database... ({attempt}/{max_attempts}) - Error: {e}"
                )
                sys.stdout.flush()
            time.sleep(1)
        except Exception as e:
            logger.error(f"❌ Unexpected error during DB connection attempt: {e}")
            sys.stdout.flush()
            time.sleep(1)

    logger.error(f"❌ Database connection timeout after {max_attempts} seconds")
    sys.stdout.flush()
    return False


def get_current_db_state():
    """現在のデータベース状態を取得"""
    try:
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            return None, None

        # SQLiteの場合はスキップ
        if database_url.startswith("sqlite"):
            return None, None

        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)

        # URLをパースして接続パラメータを取得
        parsed_url = urlparse(database_url)
        conn_params = {
            "host": parsed_url.hostname,
            "port": parsed_url.port,
            "user": parsed_url.username,
            "password": unquote(parsed_url.password) if parsed_url.password else None,
            "dbname": parsed_url.path.lstrip("/"),
        }

        # NeonDB用のSSL設定
        if "sslmode=require" in database_url:
            conn_params["sslmode"] = "require"

        with psycopg.connect(**conn_params) as conn:
            with conn.cursor() as cur:
                # テーブルの存在確認
                cur.execute(
                    """
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables
                        WHERE table_name = 'users'
                    )
                """
                )
                tables_exist = cur.fetchone()[0]

                # 現在のalembicバージョン確認（すべてのバージョンを取得）
                try:
                    cur.execute("SELECT version_num FROM alembic_version")
                    all_versions = cur.fetchall()
                    if all_versions:
                        if len(all_versions) > 1:
                            logger.warning(
                                f"⚠️  Multiple versions found in alembic_version table: {[v[0] for v in all_versions]}"
                            )
                            # 最初のバージョンを返すが、複数あることを記録
                            current_version = all_versions[0][0]
                        else:
                            current_version = all_versions[0][0]
                    else:
                        current_version = None
                except Exception:
                    current_version = None

                return tables_exist, current_version
    except Exception as e:
        logger.warning(f"Could not get DB state: {e}")
        return None, None


def fix_multiple_alembic_heads():
    """alembic_versionテーブルに複数のheadがある場合、最新のものだけを残す"""
    try:
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            return False

        # SQLiteの場合はスキップ
        if database_url.startswith("sqlite"):
            logger.info("SQLite database detected, skipping alembic heads fix")
            sys.stdout.flush()
            return True

        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)

        # URLをパースして接続パラメータを取得
        parsed_url = urlparse(database_url)
        conn_params = {
            "host": parsed_url.hostname,
            "port": parsed_url.port,
            "user": parsed_url.username,
            "password": unquote(parsed_url.password) if parsed_url.password else None,
            "dbname": parsed_url.path.lstrip("/"),
        }

        # NeonDB用のSSL設定
        if "sslmode=require" in database_url:
            conn_params["sslmode"] = "require"

        with psycopg.connect(**conn_params) as conn:
            with conn.cursor() as cur:
                # alembic_versionテーブルのすべてのバージョンを取得
                try:
                    cur.execute("SELECT version_num FROM alembic_version")
                    all_versions = cur.fetchall()

                    if len(all_versions) > 1:
                        logger.warning(
                            f"🔧 Found multiple heads in alembic_version: {[v[0] for v in all_versions]}"
                        )
                        logger.info("🔧 Cleaning up alembic_version table...")

                        # すべてのバージョンを削除
                        cur.execute("DELETE FROM alembic_version")

                        # 現在の正しいheadバージョンを挿入（4ed32ebe9919）
                        # マイグレーションファイルから確認した最新のhead
                        cur.execute(
                            "INSERT INTO alembic_version (version_num) VALUES ('4ed32ebe9919')"
                        )
                        conn.commit()

                        logger.info(
                            "✅ Cleaned up alembic_version table, set to head: 4ed32ebe9919"
                        )
                        sys.stdout.flush()
                        return True
                    else:
                        logger.info(
                            "✅ No multiple heads found, alembic_version is clean"
                        )
                        sys.stdout.flush()
                        return True

                except Exception as e:
                    logger.error(f"❌ Error checking alembic_version: {e}")
                    sys.stdout.flush()
                    return False

    except Exception as e:
        logger.error(f"❌ Could not fix multiple alembic heads: {e}")
        sys.stdout.flush()
        return False


def check_for_multiple_heads():
    """複数のAlembicヘッドが存在するかチェック"""
    try:
        result = subprocess.run(
            ["alembic", "heads"], capture_output=True, text=True, check=True
        )
        heads = [line for line in result.stdout.strip().split("\n") if line]

        if len(heads) > 1:
            logger.warning(f"⚠️  Multiple alembic heads detected ({len(heads)} heads):")
            for head in heads:
                logger.warning(f"   - {head}")
            logger.warning("   This may cause migration conflicts.")
            sys.stdout.flush()
            return True

        logger.info("✅ Single head found, alembic history is linear")
        sys.stdout.flush()
        return False
    except Exception as e:
        logger.warning(f"Could not check for multiple heads: {e}")
        sys.stdout.flush()
        return False


def reset_alembic_version_if_inconsistent():
    """テーブルが存在しないがalembic_versionにバージョンがある場合にリセット"""
    try:
        database_url = os.getenv("DATABASE_URL")
        if not database_url or database_url.startswith("sqlite"):
            return

        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)

        parsed_url = urlparse(database_url)
        conn_params = {
            "host": parsed_url.hostname,
            "port": parsed_url.port,
            "user": parsed_url.username,
            "password": unquote(parsed_url.password) if parsed_url.password else None,
            "dbname": parsed_url.path.lstrip("/"),
        }

        if "sslmode=require" in database_url:
            conn_params["sslmode"] = "require"

        with psycopg.connect(**conn_params) as conn:
            with conn.cursor() as cur:
                # usersテーブルの存在確認
                cur.execute(
                    """
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables
                        WHERE table_name = 'users'
                    )
                """
                )
                users_table_exists = cur.fetchone()[0]

                # alembic_versionテーブルの存在とバージョン確認
                cur.execute(
                    """
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables
                        WHERE table_name = 'alembic_version'
                    )
                """
                )
                alembic_table_exists = cur.fetchone()[0]

                if alembic_table_exists and not users_table_exists:
                    # テーブルがないのにalembic_versionだけある = 不整合状態
                    cur.execute("SELECT version_num FROM alembic_version")
                    versions = cur.fetchall()

                    if versions:
                        logger.warning(
                            "⚠️  Detected inconsistent state: alembic_version has versions "
                            f"{[v[0] for v in versions]} but 'users' table does not exist!"
                        )
                        logger.info(
                            "🔧 Resetting alembic_version table to fix inconsistency..."
                        )
                        cur.execute("TRUNCATE TABLE alembic_version")
                        conn.commit()
                        logger.info(
                            "✅ alembic_version table reset. Migrations will run from scratch."
                        )
                        sys.stdout.flush()

    except Exception as e:
        logger.warning(f"Could not check/reset alembic_version: {e}")
        sys.stdout.flush()


def run_migrations():
    """Alembicマイグレーションを実行"""
    logger.info("=" * 60)
    logger.info("🔄 STARTING MIGRATION PROCESS")
    logger.info("=" * 60)
    sys.stdout.flush()

    # SQLiteの場合はマイグレーションをスキップし、直接テーブルを作成
    database_url = os.getenv("DATABASE_URL")
    if database_url and database_url.startswith("sqlite"):
        logger.info("SQLite database detected, skipping migrations")
        logger.info("Creating tables directly from models...")
        sys.stdout.flush()

        try:
            # SQLAlchemyのメタデータからテーブルを作成
            from app.db.session import engine
            from app.models import Base

            Base.metadata.create_all(bind=engine)
            logger.info("✅ Tables created successfully from models!")
            sys.stdout.flush()
            return True
        except Exception as e:
            logger.error(f"❌ Failed to create tables: {e}")
            sys.stdout.flush()
            return False

    # alembic_versionとテーブルの不整合をチェック・修復
    logger.info("🔍 Checking for alembic_version inconsistency...")
    sys.stdout.flush()
    reset_alembic_version_if_inconsistent()

    # マイグレーション実行前にDB状態を確認
    tables_exist, current_version = get_current_db_state()
    logger.info(
        f"DB State: tables_exist={tables_exist}, current_version={current_version}"
    )
    sys.stdout.flush()

    # 複数のヘッドをチェック
    logger.info("🔍 Checking for multiple alembic heads...")
    sys.stdout.flush()
    check_for_multiple_heads()

    logger.info("Starting alembic upgrade heads...")
    sys.stdout.flush()

    try:
        result = subprocess.run(
            ["alembic", "upgrade", "heads"], check=True, capture_output=True, text=True
        )
        logger.info("Alembic output:")
        logger.info(result.stdout)
        logger.info("✅ Migrations completed successfully!")
        sys.stdout.flush()
        return True

    except subprocess.CalledProcessError as e:
        logger.error("❌ Migration failed!")
        logger.error(f"Error output: {e.stderr}")
        sys.stdout.flush()

        # "Multiple head revisions" エラーの場合、修復して再試行
        if "Multiple head revisions are present" in e.stderr:
            logger.info("🔧 Multiple heads detected! Fixing...")
            sys.stdout.flush()
            fix_multiple_alembic_heads()

            # 再試行
            try:
                result = subprocess.run(
                    ["alembic", "upgrade", "heads"],
                    check=True,
                    capture_output=True,
                    text=True,
                )
                logger.info(result.stdout)
                logger.info(
                    "✅ Migrations completed successfully after fixing multiple heads!"
                )
                sys.stdout.flush()
                return True
            except subprocess.CalledProcessError as e2:
                logger.error("❌ Migration still failed after fixing multiple heads!")
                logger.error(e2.stderr)
                sys.stdout.flush()
                return False

        return False


def start_server():
    """Uvicornサーバーを起動"""
    logger.info("🚀 Starting Uvicorn server...")
    sys.stdout.flush()

    # Renderの場合、PORT環境変数からポートを取得
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "0.0.0.0")

    # 本番環境では--reloadを無効化
    environment = os.getenv("ENVIRONMENT", "development")
    reload = environment != "production"

    logger.info(f"🔧 Server config: host={host}, port={port}, reload={reload}")
    sys.stdout.flush()

    if reload:
        subprocess.run(
            ["uvicorn", "app.main:app", "--host", host, "--port", str(port), "--reload"]
        )
    else:
        subprocess.run(["uvicorn", "app.main:app", "--host", host, "--port", str(port)])


if __name__ == "__main__":
    logger.info("=" * 60)
    logger.info("START.PY - INITIALIZATION")
    logger.info("=" * 60)
    sys.stdout.flush()

    if not wait_for_db():
        sys.exit(1)

    if not run_migrations():
        logger.error("Migration failed. Exiting.")
        sys.exit(1)

    start_server()
