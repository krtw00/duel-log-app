#!/usr/bin/env python3
"""
データベース接続待機とマイグレーション実行スクリプト
"""
import os
import sys
import time
import subprocess
import psycopg


def wait_for_db(max_attempts=60):
    """データベース接続を待機"""
    dsn = f"postgresql://{os.getenv('POSTGRES_USER')}:{os.getenv('POSTGRES_PASSWORD')}@{os.getenv('POSTGRES_HOST', 'db')}/{os.getenv('POSTGRES_DB')}"
    
    print(f"⏳ Waiting for database at {os.getenv('POSTGRES_HOST', 'db')}...")
    
    for attempt in range(1, max_attempts + 1):
        try:
            with psycopg.connect(dsn, connect_timeout=1) as conn:
                print("✅ Database is ready!")
                return True
        except psycopg.OperationalError:
            print(f"⏳ Waiting for database... ({attempt}/{max_attempts})")
            time.sleep(1)
    
    print(f"❌ Database connection timeout after {max_attempts} seconds")
    return False


def fix_alembic_version_if_needed():
    """存在しないリビジョンエラーの場合、最新リビジョンにスタンプ"""
    try:
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            return
        
        # psycopg3用に変換
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
        
        # テーブルが存在するか確認
        with psycopg.connect(database_url) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_name = 'users'
                    )
                """)
                tables_exist = cur.fetchone()[0]
                
                if tables_exist:
                    # テーブルが既に存在する場合、最新リビジョンにスタンプ
                    print("🔧 Tables already exist. Stamping with latest revision...")
                    cur.execute("DELETE FROM alembic_version")
                    conn.commit()
                    
                    # alembic stampコマンドを実行
                    result = subprocess.run(
                        ["alembic", "stamp", "head"],
                        capture_output=True,
                        text=True
                    )
                    if result.returncode == 0:
                        print("✅ Stamped database with latest revision")
                    else:
                        print(f"⚠️ Stamp failed: {result.stderr}")
                else:
                    # テーブルが存在しない場合、履歴をクリア
                    cur.execute("DELETE FROM alembic_version")
                    conn.commit()
                    print("🔧 Cleared alembic_version table")
    except Exception as e:
        print(f"⚠️ Could not fix alembic_version: {e}")


def run_migrations():
    """Alembicマイグレーションを実行"""
    print("🔄 Running Alembic migrations...")
    try:
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            check=True,
            capture_output=True,
            text=True
        )
        print(result.stdout)
        print("✅ Migrations completed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print("❌ Migration failed!")
        print(e.stderr)
        
        # "Can't locate revision" エラーの場合、リセットして再試行
        if "Can't locate revision" in e.stderr:
            print("🔧 Attempting to fix alembic version conflict...")
            fix_alembic_version_if_needed()
            
            # 再試行
            try:
                result = subprocess.run(
                    ["alembic", "upgrade", "head"],
                    check=True,
                    capture_output=True,
                    text=True
                )
                print(result.stdout)
                print("✅ Migrations completed successfully after fix!")
                return True
            except subprocess.CalledProcessError as e2:
                print("❌ Migration still failed after fix!")
                print(e2.stderr)
                return False
        
        return False


def start_server():
    """Uvicornサーバーを起動"""
    print("🚀 Starting Uvicorn server...")
    subprocess.run([
        "uvicorn",
        "app.main:app",
        "--host", "0.0.0.0",
        "--port", "8000",
        "--reload"
    ])


if __name__ == "__main__":
    if not wait_for_db():
        sys.exit(1)
    
    if not run_migrations():
        sys.exit(1)
    
    start_server()
