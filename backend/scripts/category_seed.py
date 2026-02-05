import argparse
import asyncio

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.core.config import settings
from app.models.category import Category as DBCategory

CATEGORY_NAMES = [
    "Màng PE in, ghép, tráng keo",
    "Màng co PE - Màng CPE",
    "Thiết bị phun sơn(BELL CUP/BELL DISK-NOZZLE)",
    "Màng PE màu",
    "Túi bao gói sản phẩm",
    "Hóa chất cho ngành giấy",
    "Lọc (FILTER) - Thiết bị",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed product categories.")
    parser.add_argument(
        "--replace",
        action="store_true",
        help="Replace all existing categories with the default set.",
    )
    return parser.parse_args()


async def seed_categories(session: AsyncSession, replace: bool) -> None:
    if replace:
        await session.execute(DBCategory.__table__.delete())
        await session.commit()

    for name in CATEGORY_NAMES:
        existing = await session.execute(select(DBCategory).where(DBCategory.name == name))
        if existing.scalars().first():
            continue
        session.add(DBCategory(name=name))
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
        await seed_categories(session, replace=args.replace)


if __name__ == "__main__":
    asyncio.run(main())
