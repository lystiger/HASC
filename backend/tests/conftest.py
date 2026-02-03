import pytest
import pytest_asyncio # Import pytest_asyncio
from typing import AsyncGenerator

from httpx import AsyncClient, ASGITransport # Import ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import sessionmaker # Keep sessionmaker for now, to easily replace it below

from app.main import app
import app.models  # noqa: F401  Ensure all models are registered for Base.metadata
from app.db.base import Base
from app.api.v1.endpoints.products import get_db
from app.api.deps import get_current_user
from app.models.user import User, UserRole

# Enable automatic mode for pytest-asyncio
pytest_asyncio_auto_mode = True

# Use a separate in-memory SQLite database for testing
TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"

engine = create_async_engine(TEST_DATABASE_URL, echo=True)
TestingSessionLocal = async_sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=AsyncSession, expire_on_commit=False)


@pytest_asyncio.fixture(scope="session", autouse=True) # Use pytest_asyncio.fixture
async def setup_database():
    """Create the database tables before running tests."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture # Use pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Provide a test database session."""
    async with TestingSessionLocal() as session:
        yield session


@pytest_asyncio.fixture # Use pytest_asyncio.fixture
async def async_client(db_session: AsyncSession) -> AsyncClient:
    """Provide a test client for making requests to the app."""

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    async def override_get_current_user():
        return User(
            id=1,
            email="test@example.com",
            hashed_password="not-used",
            full_name="Test Admin",
            role=UserRole.ADMIN,
        )

    app.dependency_overrides[get_current_user] = override_get_current_user
    async with AsyncClient(base_url="http://test", transport=ASGITransport(app=app)) as client: # Use ASGITransport
        yield client
    app.dependency_overrides.clear() # Use clear() for cleanup
