"""merge multiple heads

Revision ID: d8e9f0a1b2c3
Revises: 563a63256df2, a1b2c3d4e5f6
Create Date: 2025-10-04 06:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd8e9f0a1b2c3'
down_revision = ('563a63256df2', 'a1b2c3d4e5f6')
branch_labels = None
depends_on = None


def upgrade() -> None:
    # マージのみで実際の変更はなし
    pass


def downgrade() -> None:
    # マージのみで実際の変更はなし
    pass
