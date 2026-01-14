"""security and performance fixes from supabase advisor

Revision ID: g5h6i7j8k9l0
Revises: f4g5h6i7j8k9
Create Date: 2026-01-14 21:00:00.000000

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "g5h6i7j8k9l0"
down_revision = "f4g5h6i7j8k9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ========================================
    # 1. RLSを有効化（APIからの直接アクセスをブロック）
    # バックエンドはpostgresロールで接続するためRLSをバイパス
    # ========================================
    op.execute("ALTER TABLE users ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE decks ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE duels ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE shared_statistics ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE sharedurls ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE alembic_version ENABLE ROW LEVEL SECURITY")

    # ========================================
    # 2. profilesテーブルのRLSポリシーを最適化
    # auth.uid()を(select auth.uid())に変更して毎行の再評価を防止
    # ========================================
    # 既存のポリシーを削除
    op.execute('DROP POLICY IF EXISTS "Users can view their own profile" ON profiles')
    op.execute('DROP POLICY IF EXISTS "Users can update their own profile" ON profiles')

    # 最適化されたポリシーを作成
    op.execute("""
        CREATE POLICY "Users can view their own profile"
        ON profiles FOR SELECT
        USING (id = (SELECT auth.uid()))
    """)
    op.execute("""
        CREATE POLICY "Users can update their own profile"
        ON profiles FOR UPDATE
        USING (id = (SELECT auth.uid()))
    """)

    # ========================================
    # 3. 関数のsearch_pathを固定
    # ========================================
    # handle_new_user関数を再作成
    op.execute("""
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS trigger
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public
        AS $$
        BEGIN
            INSERT INTO public.profiles (id, email, username)
            VALUES (
                NEW.id,
                NEW.email,
                COALESCE(
                    NEW.raw_user_meta_data->>'username',
                    split_part(NEW.email, '@', 1)
                )
            );
            RETURN NEW;
        END;
        $$
    """)

    # update_updated_at_column関数を再作成
    op.execute("""
        CREATE OR REPLACE FUNCTION public.update_updated_at_column()
        RETURNS trigger
        LANGUAGE plpgsql
        SET search_path = public
        AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$
    """)

    # ========================================
    # 4. 外部キーのインデックスを追加
    # ========================================
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_decks_user_id ON decks(user_id)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_shared_statistics_user_id ON shared_statistics(user_id)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_sharedurls_user_id ON sharedurls(user_id)"
    )

    # ========================================
    # 5. 未使用のインデックスを削除
    # ========================================
    op.execute("DROP INDEX IF EXISTS ix_sharedurls_id")
    op.execute("DROP INDEX IF EXISTS ix_shared_statistics_id")
    # ix_password_reset_tokens_id は password_reset_tokens テーブルと一緒に削除済み


def downgrade() -> None:
    # インデックスを削除
    op.execute("DROP INDEX IF EXISTS idx_decks_user_id")
    op.execute("DROP INDEX IF EXISTS idx_shared_statistics_user_id")
    op.execute("DROP INDEX IF EXISTS idx_sharedurls_user_id")

    # 未使用インデックスを復元
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_sharedurls_id ON sharedurls(id)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_shared_statistics_id ON shared_statistics(id)"
    )

    # RLSポリシーを元に戻す（非最適化版）
    op.execute('DROP POLICY IF EXISTS "Users can view their own profile" ON profiles')
    op.execute('DROP POLICY IF EXISTS "Users can update their own profile" ON profiles')
    op.execute("""
        CREATE POLICY "Users can view their own profile"
        ON profiles FOR SELECT
        USING (id = auth.uid())
    """)
    op.execute("""
        CREATE POLICY "Users can update their own profile"
        ON profiles FOR UPDATE
        USING (id = auth.uid())
    """)

    # 関数のsearch_pathを元に戻す（SET search_pathなし）
    op.execute("""
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS trigger
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
            INSERT INTO public.profiles (id, email, username)
            VALUES (
                NEW.id,
                NEW.email,
                COALESCE(
                    NEW.raw_user_meta_data->>'username',
                    split_part(NEW.email, '@', 1)
                )
            );
            RETURN NEW;
        END;
        $$
    """)

    op.execute("""
        CREATE OR REPLACE FUNCTION public.update_updated_at_column()
        RETURNS trigger
        LANGUAGE plpgsql
        AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$
    """)

    # RLSを無効化
    op.execute("ALTER TABLE users DISABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE decks DISABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE duels DISABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE shared_statistics DISABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE sharedurls DISABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE alembic_version DISABLE ROW LEVEL SECURITY")
