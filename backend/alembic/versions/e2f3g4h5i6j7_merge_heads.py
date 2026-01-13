"""merge heads

Revision ID: e2f3g4h5i6j7
Revises: c1d2e3f4g5h6, d1e2f3g4h5i6
Create Date: 2026-01-13 15:00:00.000000

"""

# revision identifiers, used by Alembic.
revision = "e2f3g4h5i6j7"
down_revision = ("c1d2e3f4g5h6", "d1e2f3g4h5i6")
branch_labels = None
depends_on = None


def upgrade() -> None:
    # マージマイグレーション - 変更なし
    pass


def downgrade() -> None:
    # マージマイグレーション - 変更なし
    pass
