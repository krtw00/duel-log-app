"""add active to decks

Revision ID: c7d8e9f0a1b2
Revises: f853e5404fb3
Create Date: 2025-10-04 05:40:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c7d8e9f0a1b2'
down_revision = 'd8e9f0a1b2c3'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # activeカラムを追加（デフォルトはTrue）
    op.add_column('decks', sa.Column('active', sa.Boolean(), nullable=False, server_default='true'))


def downgrade() -> None:
    op.drop_column('decks', 'active')
