"""add_theme_preference_to_users

Revision ID: a1b2c3d4e5f7
Revises: a1b2c3d4e5f6
Create Date: 2025-10-20 13:00:00.000000

"""

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "a1b2c3d4e5f7"
down_revision = "a1b2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add theme_preference column to users table
    op.add_column(
        "users",
        sa.Column(
            "theme_preference", sa.String(), server_default="dark", nullable=False
        ),
    )


def downgrade() -> None:
    # Remove theme_preference column from users table
    op.drop_column("users", "theme_preference")
