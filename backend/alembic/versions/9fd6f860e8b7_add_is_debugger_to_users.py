"""add_is_debugger_to_users

Revision ID: 9fd6f860e8b7
Revises: fc690e860af8
Create Date: 2026-01-21 18:20:45.145922

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9fd6f860e8b7'
down_revision = 'fc690e860af8'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'users',
        sa.Column('is_debugger', sa.Boolean(), server_default='false', nullable=False)
    )


def downgrade() -> None:
    op.drop_column('users', 'is_debugger')
