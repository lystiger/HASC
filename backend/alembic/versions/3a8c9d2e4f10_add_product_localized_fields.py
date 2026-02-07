"""Add localized product fields

Revision ID: 3a8c9d2e4f10
Revises: d871b34c3756
Create Date: 2026-02-07
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "3a8c9d2e4f10"
down_revision = "d871b34c3756"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("products", sa.Column("name_en", sa.String(), nullable=True))
    op.add_column("products", sa.Column("name_vi", sa.String(), nullable=True))
    op.add_column("products", sa.Column("description_en", sa.Text(), nullable=True))
    op.add_column("products", sa.Column("description_vi", sa.Text(), nullable=True))

    op.execute(
        """
        UPDATE products
        SET name_en = COALESCE(name_en, name),
            name_vi = COALESCE(name_vi, name),
            description_en = COALESCE(description_en, description),
            description_vi = COALESCE(description_vi, description)
        """
    )

    op.alter_column("products", "name_en", nullable=False)
    op.alter_column("products", "name_vi", nullable=False)
    op.alter_column("products", "description_en", nullable=False)
    op.alter_column("products", "description_vi", nullable=False)


def downgrade() -> None:
    op.drop_column("products", "description_vi")
    op.drop_column("products", "description_en")
    op.drop_column("products", "name_vi")
    op.drop_column("products", "name_en")
