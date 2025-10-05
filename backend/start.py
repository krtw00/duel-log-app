#!/usr/bin/env python3
"""
データベース接続待機とマイグレーション実行スクリプト
"""
import os
import sys
import time
import subprocess
import psycopg
import logging

# ログ設定（標準出力に確実に出力）
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ],
    force=True
)
logger = logging.getLogger(__name__)


def wait_for_db(max_attempts=60):
    """データベース接続を待機"""
    # DATABASE_URLを使用（Render/Neon用）
    dsn = os.getenv('DATABASE_URL')
    if not dsn:
        # フォールバック：個別の環境変数を使用
        dsn = f"postgresql://{os.getenv('POSTGRES_USER')}:{os.getenv('POSTGRES_PASSWORD')}@{os.getenv('POSTGRES_HOST', 'db')}/{os.getenv('POSTGRES_DB')}"
    
    # psycopg3用に変換
    if dsn.startswith("postgres://"):
        dsn = dsn.replace("postgres://", "postgresql://", 1)
    
    logger.info(f"Database URL: {dsn.split('@')[1] if '@' in dsn else 'unknown'}")
    logger.info("⏳ Waiting for database connection...")
    sys.stdout.flush()
    
    for attempt in range(1, max_attempts + 1):
        try:
            with psycopg.connect(dsn, connect_timeout=1) as conn:
                logger.info("✅ Database is ready!")
                sys.stdout.flush()
                return True
        except psycopg.OperationalError:
            if attempt % 10 == 0:  # 10回ごとにログ出力
                logger.info(f"⏳ Waiting for database... ({attempt}/{max_attempts})")
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
        
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
        
        with psycopg.connect(database_url) as conn:
            with conn.cursor() as cur:
                # テーブルの存在確認
                cur.execute("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_name = 'users'
                    )
                """)
                tables_exist = cur.fetchone()[0]
                
                # 現在のalembicバージョン確認
                try:
                    cur.execute("SELECT version_num FROM alembic_version")
                    current_version = cur.fetchone()
                    current_version = current_version[0] if current_version else None
                except:
                    current_version = None
                
                return tables_exist, current_version
    except Exception as e:
        logger.warning(f"Could not get DB state: {e}")
        return None, None


def fix_alembic_version_if_needed():
    """存在しないリビジョンエラーの場合、初期リビジョンを設定してマイグレーション実行"""
    try:
        tables_exist, current_version = get_current_db_state()
        
        logger.info("📊 Current DB state:")
        logger.info(f"   - Tables exist: {tables_exist}")
        logger.info(f"   - Current version: {current_version}")
        sys.stdout.flush()
        
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            return
        
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
        
        if tables_exist:
            # テーブルが既に存在する場合、初期リビジョンを設定
            logger.info("🔧 Tables already exist. Setting initial revision...")
            logger.info("   (This will allow missing migrations to run)")
            sys.stdout.flush()
            
            with psycopg.connect(database_url) as conn:
                with conn.cursor() as cur:
                    # 現在のバージョンを確認
                    try:
                        cur.execute("SELECT version_num FROM alembic_version")
                        current = cur.fetchone()
                        if current:
                            logger.info(f"   Current version: {current[0]}")
                        else:
                            logger.info("   No version found, setting to initial")
                            # バージョンがない場合は初期リビジョンに設定
                            cur.execute("DELETE FROM alembic_version")
                            cur.execute("INSERT INTO alembic_version (version_num) VALUES ('5c16ff509f3d')")
                            conn.commit()
                            logger.info("   Set to initial revision: 5c16ff509f3d")
                        sys.stdout.flush()
                    except Exception as e:
                        logger.error(f"   Could not check version: {e}")
                        sys.stdout.flush()
        else:
            # テーブルが存在しない場合、履歴をクリア
            with psycopg.connect(database_url) as conn:
                with conn.cursor() as cur:
                    cur.execute("DELETE FROM alembic_version")
                    conn.commit()
            logger.info("🔧 Cleared alembic_version table")
            sys.stdout.flush()
            
    except Exception as e:
        logger.error(f"Could not fix alembic_version: {e}")
        sys.stdout.flush()


def run_migrations():
    """Alembicマイグレーションを実行"""
    logger.info("="*60)
    logger.info("🔄 STARTING MIGRATION PROCESS")
    logger.info("="*60)
    sys.stdout.flush()
    
    # マイグレーション実行前にDB状態を確認
    tables_exist, current_version = get_current_db_state()
    logger.info(f"DB State: tables_exist={tables_exist}, current_version={current_version}")
    sys.stdout.flush()
    
    # テーブルが存在するがバージョンがない/不一致の場合、事前に修復
    if tables_exist and not current_version:
        logger.info("🔧 Tables exist but no version found. Fixing before migration...")
        sys.stdout.flush()
        fix_alembic_version_if_needed()
    
    logger.info("Starting alembic upgrade head...")
    sys.stdout.flush()
    
    try:
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            check=True,
            capture_output=True,
            text=True
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
        
        # "Can't locate revision" エラーの場合、修復して再試行
        if "Can't locate revision" in e.stderr:
            logger.info("🔧 Attempting to fix alembic version conflict...")
            sys.stdout.flush()
            fix_alembic_version_if_needed()
            
            # 再試行
            try:
                result = subprocess.run(
                    ["alembic", "upgrade", "head"],
                    check=True,
                    capture_output=True,
                    text=True
                )
                logger.info(result.stdout)
                logger.info("✅ Migrations completed successfully after fix!")
                sys.stdout.flush()
                return True
            except subprocess.CalledProcessError as e2:
                logger.error("❌ Migration still failed after fix!")
                logger.error(e2.stderr)
                sys.stdout.flush()
                return False
        
        # "DuplicateTable" エラーの場合も修復
        elif "DuplicateTable" in e.stderr or "already exists" in e.stderr:
            logger.info("🔧 Tables already exist. Fixing version mismatch...")
            sys.stdout.flush()
            fix_alembic_version_if_needed()
            
            # 再試行（今度は変更なしで成功するはず）
            try:
                result = subprocess.run(
                    ["alembic", "upgrade", "head"],
                    check=True,
                    capture_output=True,
                    text=True
                )
                logger.info(result.stdout)
                logger.info("✅ Migrations synced successfully!")
                sys.stdout.flush()
                return True
            except subprocess.CalledProcessError as e2:
                logger.error("❌ Still failed after sync!")
                logger.error(e2.stderr)
                sys.stdout.flush()
                return False
        
        return False


def start_server():
    """Uvicornサーバーを起動"""
    logger.info("🚀 Starting Uvicorn server...")
    sys.stdout.flush()
    subprocess.run([
        "uvicorn",
        "app.main:app",
        "--host", "0.0.0.0",
        "--port", "8000",
        "--reload"
    ])


if __name__ == "__main__":
    logger.info("="*60)
    logger.info("START.PY - INITIALIZATION")
    logger.info("="*60)
    sys.stdout.flush()
    
    if not wait_for_db():
        sys.exit(1)
    
    if not run_migrations():
        logger.error("Migration failed, but continuing to start server...")
        sys.stdout.flush()
        # 本番環境では続行（手動で修正済みの場合）
    
    start_server()
