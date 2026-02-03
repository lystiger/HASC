"""Add USER role to userrole enum

Revision ID: 5b8b8a7e2c1f
Revises: 9b1a8c3c7b2d
Create Date: 2026-02-03 22:45:00.000000

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "5b8b8a7e2c1f"
down_revision: Union[str, Sequence[str], None] = "9b1a8c3c7b2d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'USER'")


def downgrade() -> None:
    """Downgrade schema."""
    # Postgres does not support removing enum values without recreating the type.
    pass
