"""Rename duel fields for clarity

Revision ID: 4ed32ebe9919
Revises: 222d71523879
Create Date: 2025-10-31 02:15:30.530343

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '4ed32ebe9919'
down_revision = '222d71523879'
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column('duels', 'result', new_column_name='is_win')
    op.alter_column('duels', 'coin', new_column_name='won_coin_toss')
    op.alter_column('duels', 'first_or_second', new_column_name='is_going_first')


def downgrade():
    op.alter_column('duels', 'is_win', new_column_name='result')
    op.alter_column('duels', 'won_coin_toss', new_column_name='coin')
    op.alter_column('duels', 'is_going_first', new_column_name='first_or_second')