import argparse
import asyncio

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.core.config import settings
from app.models.category import Category as DBCategory

CATEGORY_DEFAULTS = [
    {
        "code": "PE_FILM_PRINTED_LAMINATED",
        "name_en": "Printed / laminated PE film with adhesive coating",
        "name_vi": "Màng PE in, ghép, tráng keo",
    },
    {
        "code": "PE_SHRINK_FILM",
        "name_en": "PE shrink film - CPE film",
        "name_vi": "Màng co PE - Màng CPE",
    },
    {
        "code": "PAINT_SPRAY_EQUIPMENT",
        "name_en": "Paint spray equipment (Bell Cup / Bell Disk - Nozzle)",
        "name_vi": "Thiết bị phun sơn(BELL CUP/BELL DISK-NOZZLE)",
    },
    {
        "code": "COLORED_PE_FILM",
        "name_en": "Colored PE film",
        "name_vi": "Màng PE màu",
    },
    {
        "code": "PACKAGING_BAGS",
        "name_en": "Product packaging bags",
        "name_vi": "Túi bao gói sản phẩm",
    },
    {
        "code": "PAPER_CHEMICALS",
        "name_en": "Paper industry chemicals",
        "name_vi": "Hóa chất cho ngành giấy",
    },
    {
        "code": "FILTER_EQUIPMENT",
        "name_en": "Filters (FILTER) - Equipment",
        "name_vi": "Lọc (FILTER) - Thiết bị",
    },
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed product categories.")
    parser.add_argument(
        "--replace",
        action="store_true",
        help="Replace all existing categories with the default set.",
    )
    parser.add_argument(
        "--delete-products",
        action="store_true",
        help="Delete all products before replacing categories.",
    )
    return parser.parse_args()


async def seed_categories(session: AsyncSession, replace: bool, delete_products: bool) -> None:
    if replace:
        if delete_products:
            await session.execute(text("DELETE FROM tasks"))
            await session.execute(text("DELETE FROM products"))
            await session.commit()
        await session.execute(DBCategory.__table__.delete())
        await session.commit()

    for category in CATEGORY_DEFAULTS:
        existing = await session.execute(
            select(DBCategory).where(DBCategory.code == category["code"])
        )
        if existing.scalars().first():
            continue
        session.add(
            DBCategory(
                code=category["code"],
                name_en=category["name_en"],
                name_vi=category["name_vi"],
            )
        )
    await session.commit()


async def main() -> None:
    args = parse_args()
    engine = create_async_engine(settings.DATABASE_URL, pool_pre_ping=True)
    SessionLocal = async_sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async with SessionLocal() as session:
        await seed_categories(session, replace=args.replace, delete_products=args.delete_products)


if __name__ == "__main__":
    asyncio.run(main())
