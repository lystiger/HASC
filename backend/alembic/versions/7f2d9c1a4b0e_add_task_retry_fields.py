"""Add retry fields to tasks

Revision ID: 7f2d9c1a4b0e
Revises: 5b8b8a7e2c1f
Create Date: 2026-02-03 23:25:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "7f2d9c1a4b0e"
down_revision: Union[str, Sequence[str], None] = "5b8b8a7e2c1f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("tasks", sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("tasks", sa.Column("max_attempts", sa.Integer(), nullable=False, server_default="3"))
    op.alter_column("tasks", "attempts", server_default=None)
    op.alter_column("tasks", "max_attempts", server_default=None)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("tasks", "max_attempts")
    op.drop_column("tasks", "attempts")
