"""Add localized category names and code

Revision ID: 2f3d6c2c4a9b
Revises: 9b1a8c3c7b2d
Create Date: 2026-02-07
"""

from alembic import op
import sqlalchemy as sa
import unicodedata
import re


# revision identifiers, used by Alembic.
revision = "2f3d6c2c4a9b"
down_revision = "9b1a8c3c7b2d"
branch_labels = None
depends_on = None


def _normalize_code(value: str) -> str:
    if not value:
        return "CATEGORY"
    normalized = unicodedata.normalize("NFKD", value)
    ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
    ascii_value = re.sub(r"[^A-Za-z0-9]+", "_", ascii_value)
    ascii_value = re.sub(r"_+", "_", ascii_value).strip("_")
    return ascii_value.upper() or "CATEGORY"


def upgrade() -> None:
    op.alter_column("categories", "name", new_column_name="code")
    op.add_column("categories", sa.Column("name_en", sa.String(), nullable=True))
    op.add_column("categories", sa.Column("name_vi", sa.String(), nullable=True))

    op.drop_index(op.f("ix_categories_name"), table_name="categories")
    op.create_index(op.f("ix_categories_code"), "categories", ["code"], unique=True)

    vi_mappings = {
        "Màng PE in, ghép, tráng keo": {
            "code": "PE_FILM_PRINTED_LAMINATED",
            "en": "Printed / laminated PE film with adhesive coating",
            "vi": "Màng PE in, ghép, tráng keo",
        },
        "Màng co PE - Màng CPE": {
            "code": "PE_SHRINK_FILM",
            "en": "PE shrink film - CPE film",
            "vi": "Màng co PE - Màng CPE",
        },
        "Thiết bị phun sơn(BELL CUP/BELL DISK-NOZZLE)": {
            "code": "PAINT_SPRAY_EQUIPMENT",
            "en": "Paint spray equipment (Bell Cup / Bell Disk - Nozzle)",
            "vi": "Thiết bị phun sơn(BELL CUP/BELL DISK-NOZZLE)",
        },
        "Màng PE màu": {
            "code": "COLORED_PE_FILM",
            "en": "Colored PE film",
            "vi": "Màng PE màu",
        },
        "Túi bao gói sản phẩm": {
            "code": "PACKAGING_BAGS",
            "en": "Product packaging bags",
            "vi": "Túi bao gói sản phẩm",
        },
        "Hóa chất cho ngành giấy": {
            "code": "PAPER_CHEMICALS",
            "en": "Paper industry chemicals",
            "vi": "Hóa chất cho ngành giấy",
        },
        "Lọc (FILTER) - Thiết bị": {
            "code": "FILTER_EQUIPMENT",
            "en": "Filters (FILTER) - Equipment",
            "vi": "Lọc (FILTER) - Thiết bị",
        },
    }

    code_mappings = {
        "PACKAGING": {"en": "Packaging", "vi": "Bao bì"},
        "FILTERS": {"en": "Filters", "vi": "Bộ lọc"},
        "CHEMICALS": {"en": "Chemicals", "vi": "Hóa chất"},
        "EQUIPMENT": {"en": "Equipment", "vi": "Thiết bị"},
    }

    conn = op.get_bind()
    rows = conn.execute(sa.text("SELECT id, code FROM categories")).fetchall()
    for row in rows:
        original = row.code
        if original in vi_mappings:
            mapping = vi_mappings[original]
            code = mapping["code"]
            name_en = mapping["en"]
            name_vi = mapping["vi"]
        elif original in code_mappings:
            code = original
            name_en = code_mappings[original]["en"]
            name_vi = code_mappings[original]["vi"]
        else:
            code = _normalize_code(original)
            name_en = original
            name_vi = original
        conn.execute(
            sa.text(
                "UPDATE categories SET code = :code, name_en = :name_en, name_vi = :name_vi WHERE id = :id"
            ),
            {"code": code, "name_en": name_en, "name_vi": name_vi, "id": row.id},
        )

    op.alter_column("categories", "code", nullable=False)
    op.alter_column("categories", "name_en", nullable=False)
    op.alter_column("categories", "name_vi", nullable=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_categories_code"), table_name="categories")
    op.create_index(op.f("ix_categories_name"), "categories", ["code"], unique=True)

    op.drop_column("categories", "name_vi")
    op.drop_column("categories", "name_en")
    op.alter_column("categories", "code", new_column_name="name")
