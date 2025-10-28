"""rename fields for clarity

Revision ID: d4e5f6a7b8c9
Revises: 58c982173971
Create Date: 2025-10-28 13:39:05.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "d4e5f6a7b8c9"
down_revision = "58c982173971"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    命名規則を統一するためのカラム名変更

    変更内容:
    - opponentDeck_id → opponent_deck_id (snake_case統一)
    - result → is_win (ブール値の明確化)
    - coin → won_coin_toss (コイントス勝敗の明確化)
    - first_or_second → is_going_first (先攻/後攻の明確化)
    """
    # カラム名変更
    op.alter_column('duels', 'opponentDeck_id', new_column_name='opponent_deck_id')
    op.alter_column('duels', 'result', new_column_name='is_win')
    op.alter_column('duels', 'coin', new_column_name='won_coin_toss')
    op.alter_column('duels', 'first_or_second', new_column_name='is_going_first')


def downgrade() -> None:
    """
    ロールバック用: 旧カラム名に戻す
    """
    # カラム名を元に戻す
    op.alter_column('duels', 'opponent_deck_id', new_column_name='opponentDeck_id')
    op.alter_column('duels', 'is_win', new_column_name='result')
    op.alter_column('duels', 'won_coin_toss', new_column_name='coin')
    op.alter_column('duels', 'is_going_first', new_column_name='first_or_second')
