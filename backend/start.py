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
        print(f"⚠️ Could not get DB state: {e}")
        return None, None


def fix_alembic_version_if_needed():
    """存在しないリビジョンエラーの場合、初期リビジョンを設定してマイグレーション実行"""
    try:
        tables_exist, current_version = get_current_db_state()
        
        print(f"📊 Current DB state:")
        print(f"   - Tables exist: {tables_exist}")
        print(f"   - Current version: {current_version}")
        
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            return
        
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
        
        if tables_exist:
            # テーブルが既に存在する場合、初期リビジョンを設定
            print("🔧 Tables already exist. Setting initial revision...")
            print("   (This will allow missing migrations to run)")
            
            with psycopg.connect(database_url) as conn:
                with conn.cursor() as cur:
                    # 現在のバージョンを確認
                    try:
                        cur.execute("SELECT version_num FROM alembic_version")
                        current = cur.fetchone()
                        if current:
                            print(f"   Current version: {current[0]}")
                        else:
                            print("   No version found, setting to initial")
                            # バージョンがない場合は初期リビジョンに設定
                            cur.execute("DELETE FROM alembic_version")
                            cur.execute("INSERT INTO alembic_version (version_num) VALUES ('5c16ff509f3d')")
                            conn.commit()
                            print("   Set to initial revision: 5c16ff509f3d")
                    except Exception as e:
                        print(f"   Could not check version: {e}")
        else:
            # テーブルが存在しない場合、履歴をクリア
            with psycopg.connect(database_url) as conn:
                with conn.cursor() as cur:
                    cur.execute("DELETE FROM alembic_version")
                    conn.commit()
            print("🔧 Cleared alembic_version table")
            
    except Exception as e:
        print(f"⚠️ Could not fix alembic_version: {e}")


def run_migrations():
    """Alembicマイグレーションを実行"""
    print("🔄 Running Alembic migrations...")
    
    # マイグレーション実行前にDB状態を確認
    tables_exist, current_version = get_current_db_state()
    
    # テーブルが存在するがバージョンがない/不一致の場合、事前に修復
    if tables_exist and not current_version:
        print("🔧 Tables exist but no version found. Fixing before migration...")
        fix_alembic_version_if_needed()
    
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
        
        # "Can't locate revision" エラーの場合、修復して再試行
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
        
        # "DuplicateTable" エラーの場合も修復
        elif "DuplicateTable" in e.stderr or "already exists" in e.stderr:
            print("🔧 Tables already exist. Fixing version mismatch...")
            fix_alembic_version_if_needed()
            
            # 再試行（今度は変更なしで成功するはず）
            try:
                result = subprocess.run(
                    ["alembic", "upgrade", "head"],
                    check=True,
                    capture_output=True,
                    text=True
                )
                print(result.stdout)
                print("✅ Migrations synced successfully!")
                return True
            except subprocess.CalledProcessError as e2:
                print("❌ Still failed after sync!")
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
