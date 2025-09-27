"""Add default timestamps

Revision ID: b60f0d109415
Revises: 83290d50b360
Create Date: 2025-09-26 16:38:24.495314

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b60f0d109415'
down_revision = '83290d50b360'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("users", "createdat", server_default=sa.text("now()"))
    op.alter_column("users", "updatedat", server_default=sa.text("now()"))

def downgrade() -> None:
    op.alter_column("users", "createdat", server_default=None)
    op.alter_column("users", "updatedat", server_default=None)
