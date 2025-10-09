"""add game mode and rate value to duels

Revision ID: 9f8a2d3e4b5c
Revises: f853e5404fb3
Create Date: 2025-10-02 12:00:00.000000

"""

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "9f8a2d3e4b5c"
down_revision = "f853e5404fb3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # game_mode列を追加（RANK, RATE, EVENTのいずれか）
    op.add_column(
        "duels",
        sa.Column(
            "game_mode", sa.String(length=10), nullable=False, server_default="RANK"
        ),
    )

    # rate_value列を追加（レートモード時の数値）
    op.add_column("duels", sa.Column("rate_value", sa.Integer(), nullable=True))

    # rank列をnullableに変更（レートモード時はnull）
    op.alter_column("duels", "rank", existing_type=sa.Integer(), nullable=True)


def downgrade() -> None:
    # カラムを削除
    op.drop_column("duels", "rate_value")
    op.drop_column("duels", "game_mode")

    # rank列を元に戻す
    op.alter_column("duels", "rank", existing_type=sa.Integer(), nullable=False)
