"""drop_sharedurls_table

レガシーのsharedurlsテーブルを削除する。
OBSオーバーレイ機能の廃止に伴い、SharedUrlモデルは不要となった。
統計共有機能はshared_statisticsテーブルに一本化されている。

Revision ID: fc690e860af8
Revises: h6i7j8k9l0m1
Create Date: 2026-01-17 02:06:13.367907

"""

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "fc690e860af8"
down_revision = "h6i7j8k9l0m1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """sharedurlsテーブルを削除"""
    op.drop_table("sharedurls")


def downgrade() -> None:
    """sharedurlsテーブルを再作成（ロールバック用）"""
    op.create_table(
        "sharedurls",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("year_month", sa.String(), nullable=False),
        sa.Column("url", sa.String(), nullable=False),
        sa.Column("createdat", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updatedat", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("url"),
    )
    op.create_index("ix_sharedurls_id", "sharedurls", ["id"], unique=False)
