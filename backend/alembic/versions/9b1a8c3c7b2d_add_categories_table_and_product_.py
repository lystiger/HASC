"""Add categories table and migrate product category

Revision ID: 9b1a8c3c7b2d
Revises: 6d340c0bf5bc
Create Date: 2026-02-03 22:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "9b1a8c3c7b2d"
down_revision: Union[str, Sequence[str], None] = "6d340c0bf5bc"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "categories",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_categories_id"), "categories", ["id"], unique=False)
    op.create_index(op.f("ix_categories_name"), "categories", ["name"], unique=True)

    op.add_column("products", sa.Column("category_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_products_category_id_categories",
        "products",
        "categories",
        ["category_id"],
        ["id"],
    )

    op.execute(
        """
        INSERT INTO categories (name)
        SELECT DISTINCT category FROM products
        """
    )
    op.execute(
        """
        UPDATE products
        SET category_id = categories.id
        FROM categories
        WHERE products.category::text = categories.name
        """
    )

    op.alter_column("products", "category_id", nullable=False)
    op.drop_column("products", "category")

    op.execute("DROP TYPE IF EXISTS productcategory")


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column(
        "products",
        sa.Column(
            "category",
            sa.Enum("PACKAGING", "FILTERS", "CHEMICALS", "EQUIPMENT", name="productcategory"),
            nullable=True,
        ),
    )
    op.execute(
        """
        UPDATE products
        SET category = categories.name
        FROM categories
        WHERE products.category_id = categories.id
        """
    )
    op.alter_column("products", "category", nullable=False)

    op.drop_constraint("fk_products_category_id_categories", "products", type_="foreignkey")
    op.drop_column("products", "category_id")

    op.drop_index(op.f("ix_categories_name"), table_name="categories")
    op.drop_index(op.f("ix_categories_id"), table_name="categories")
    op.drop_table("categories")
