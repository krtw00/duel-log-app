"""add_performance_indexes_to_duels

Revision ID: a1b2c3d4e5f8
Revises: 4b1bece8c168
Create Date: 2025-11-05 13:00:00.000000

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "a1b2c3d4e5f8"
down_revision = "4b1bece8c168"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """パフォーマンス向上のためのインデックスを追加

    これらのインデックスは以下のクエリパターンを最適化します:
    1. ユーザーIDでのフィルタリング（統計情報の取得）
    2. ユーザーID + ゲームモードでのフィルタリング
    3. 日付範囲でのフィルタリング
    4. ユーザーID + 日付での並び替え
    """
    # ユーザーIDの単独インデックス（既存の場合はスキップ）
    op.create_index(
        "idx_duels_user_id",
        "duels",
        ["user_id"],
        unique=False,
        if_not_exists=True,
    )

    # ユーザーID + ゲームモードの複合インデックス
    # 統計情報の取得で頻繁に使用される
    op.create_index(
        "idx_duels_user_game_mode",
        "duels",
        ["user_id", "game_mode"],
        unique=False,
        if_not_exists=True,
    )

    # played_dateの降順インデックス
    # 最新の対戦データを取得する際に使用
    op.create_index(
        "idx_duels_played_date_desc",
        "duels",
        ["played_date"],
        unique=False,
        postgresql_using="btree",
        postgresql_ops={"played_date": "DESC"},
        if_not_exists=True,
    )

    # ユーザーID + played_dateの複合インデックス
    # ユーザー別の時系列データ取得を最適化
    op.create_index(
        "idx_duels_user_played_date",
        "duels",
        ["user_id", "played_date"],
        unique=False,
        postgresql_using="btree",
        postgresql_ops={"played_date": "DESC"},
        if_not_exists=True,
    )

    # デッキIDでのフィルタリング用インデックス
    op.create_index(
        "idx_duels_deck_id",
        "duels",
        ["deck_id"],
        unique=False,
        if_not_exists=True,
    )

    # 相手デッキIDでのフィルタリング用インデックス
    op.create_index(
        "idx_duels_opponent_deck_id",
        "duels",
        ["opponent_deck_id"],
        unique=False,
        if_not_exists=True,
    )


def downgrade() -> None:
    """インデックスを削除"""
    op.drop_index("idx_duels_opponent_deck_id", table_name="duels", if_exists=True)
    op.drop_index("idx_duels_deck_id", table_name="duels", if_exists=True)
    op.drop_index("idx_duels_user_played_date", table_name="duels", if_exists=True)
    op.drop_index("idx_duels_played_date_desc", table_name="duels", if_exists=True)
    op.drop_index("idx_duels_user_game_mode", table_name="duels", if_exists=True)
    op.drop_index("idx_duels_user_id", table_name="duels", if_exists=True)
