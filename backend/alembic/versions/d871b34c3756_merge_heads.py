"""merge heads

Revision ID: d871b34c3756
Revises: 2f3d6c2c4a9b, 7f2d9c1a4b0e
Create Date: 2026-02-07 18:07:37.402194

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd871b34c3756'
down_revision: Union[str, Sequence[str], None] = ('2f3d6c2c4a9b', '7f2d9c1a4b0e')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
