"""add dc value to duels

Revision ID: a1b2c3d4e5f6
Revises: 9f8a2d3e4b5c
Create Date: 2025-10-02 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = '9f8a2d3e4b5c'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # dc_value列を追加（DCモード時の数値）
    op.add_column('duels', sa.Column('dc_value', sa.Integer(), nullable=True))
    
    # game_modeの長さを拡張（DCを追加するため）
    op.alter_column('duels', 'game_mode',
                    existing_type=sa.String(length=10),
                    type_=sa.String(length=10),
                    nullable=False)


def downgrade() -> None:
    # カラムを削除
    op.drop_column('duels', 'dc_value')
