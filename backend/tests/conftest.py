import os

# The application intentionally has no built-in SECRET_KEY fallback and refuses to
# import without one. Provide a throwaway value for the test suite *before* any app
# module is imported. setdefault means a real exported SECRET_KEY still wins.
os.environ.setdefault("SECRET_KEY", "test-secret-key-not-for-production-use")
os.environ.setdefault("UPLOAD_DIR", "backend/uploads")
os.environ.setdefault("TEMP_UPLOAD_DIR", "backend/temp_uploads")
if os.environ.get("UPLOAD_DIR", "").startswith("/app"):
    os.environ["UPLOAD_DIR"] = "backend/uploads"
if os.environ.get("TEMP_UPLOAD_DIR", "").startswith("/app"):
    os.environ["TEMP_UPLOAD_DIR"] = "backend/temp_uploads"

import pytest
import pytest_asyncio
from typing import AsyncGenerator

from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

import app.models as _models  # noqa: F401  Ensure all models are registered for Base.metadata
from app.main import app
from app.db.base import Base
from app.api.v1.endpoints.products import get_db
from app.api.deps import get_current_user, get_optional_user
from app.models.user import User, UserRole

# Enable automatic mode for pytest-asyncio
pytest_asyncio_auto_mode = True

# Use a separate in-memory SQLite database for testing
TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"

engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestingSessionLocal = async_sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=AsyncSession, expire_on_commit=False)


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_database():
    """Create the database tables before running tests."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Provide a test database session."""
    async with TestingSessionLocal() as session:
        yield session
        for table in reversed(Base.metadata.sorted_tables):
            await session.execute(table.delete())
        await session.commit()


@pytest_asyncio.fixture
async def async_client(db_session: AsyncSession) -> AsyncClient:
    """Provide a test client for making requests to the app."""

    async def override_get_db():
        yield db_session

    admin_user = User(
        id=1,
        email="test@example.com",
        hashed_password="not-used",
        full_name="Test Admin",
        role=UserRole.ADMIN,
    )

    async def override_get_current_user():
        return admin_user

    async def override_get_optional_user():
        return admin_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[get_optional_user] = override_get_optional_user
    async with AsyncClient(base_url="http://test", transport=ASGITransport(app=app)) as client:
        yield client
    app.dependency_overrides.clear()
