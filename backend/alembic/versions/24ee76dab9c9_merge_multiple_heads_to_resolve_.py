"""Merge multiple heads to resolve migration conflict

Revision ID: 24ee76dab9c9
Revises: 4b1bece8c168, d4e5f6a7b8c9, a1b2c3d4e5f7
Create Date: 2025-10-28 09:45:05.115333

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '24ee76dab9c9'
down_revision = ('4b1bece8c168', 'd4e5f6a7b8c9', 'a1b2c3d4e5f7')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
