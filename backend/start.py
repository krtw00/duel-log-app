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
