import argparse
import asyncio

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.core.config import settings
from app.core.security import get_password_hash
from app.crud import crud_user
from app.schemas.user import UserCreate
from app.models.user import UserRole


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create or reset an admin user.")
    parser.add_argument("--email", required=True, help="User email")
    parser.add_argument("--password", required=True, help="Plaintext password")
    parser.add_argument("--full-name", default="Admin", help="Full name")
    parser.add_argument(
        "--role",
        default=UserRole.ADMIN.value,
        choices=[role.value for role in UserRole],
        help="User role",
    )
    return parser.parse_args()


async def upsert_user(session: AsyncSession, email: str, password: str, full_name: str, role: str) -> None:
    user = await crud_user.get_user_by_email(session, email=email)
    if user:
        user.hashed_password = get_password_hash(password)
        user.full_name = full_name
        user.role = UserRole(role)
        session.add(user)
        await session.commit()
        return

    user_in = UserCreate(
        email=email,
        password=password,
        full_name=full_name,
        role=UserRole(role),
    )
    await crud_user.create_user(session, obj_in=user_in)


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
        await upsert_user(session, args.email, args.password, args.full_name, args.role)


if __name__ == "__main__":
    asyncio.run(main())
