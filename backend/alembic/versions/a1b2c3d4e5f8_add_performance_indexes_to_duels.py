"""add_performance_indexes_to_duels

Revision ID: a1b2c3d4e5f8
Revises: 4ed32ebe9919
Create Date: 2025-10-15 10:00:00.000000

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "a1b2c3d4e5f8"
down_revision = "4ed32ebe9919"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    パフォーマンス向上のためのインデックスを追加
    インデックスが既に存在する場合はスキップする
    """
    # idx_duels_user_id インデックスを作成（存在しない場合のみ）
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS idx_duels_user_id ON duels (user_id)
        """
    )

    # idx_duels_deck_id インデックスを作成（存在しない場合のみ）
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS idx_duels_deck_id ON duels (deck_id)
        """
    )

    # idx_duels_opponent_deck_id インデックスを作成（存在しない場合のみ）
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS idx_duels_opponent_deck_id ON duels (opponent_deck_id)
        """
    )

    # idx_duels_game_mode インデックスを作成（存在しない場合のみ）
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS idx_duels_game_mode ON duels (game_mode)
        """
    )

    # idx_duels_duel_date インデックスを作成（存在しない場合のみ）
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS idx_duels_duel_date ON duels (duel_date)
        """
    )


def downgrade() -> None:
    """
    インデックスを削除
    """
    op.execute("DROP INDEX IF EXISTS idx_duels_user_id")
    op.execute("DROP INDEX IF EXISTS idx_duels_deck_id")
    op.execute("DROP INDEX IF EXISTS idx_duels_opponent_deck_id")
    op.execute("DROP INDEX IF EXISTS idx_duels_game_mode")
    op.execute("DROP INDEX IF EXISTS idx_duels_duel_date")
