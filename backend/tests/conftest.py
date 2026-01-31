import pytest
import pytest_asyncio # Import pytest_asyncio
from typing import AsyncGenerator

from httpx import AsyncClient, ASGITransport # Import ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.base import Base
from app.api.v1.endpoints.products import get_db

# Enable automatic mode for pytest-asyncio
pytest_asyncio_auto_mode = True

# Use a separate in-memory SQLite database for testing
TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"

engine = create_async_engine(TEST_DATABASE_URL, echo=True)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=AsyncSession)


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
    async with AsyncClient(app=app, base_url="http://test", transport=ASGITransport(app=app)) as client: # Use ASGITransport
        yield client
    app.dependency_overrides.clear() # Use clear() for cleanup
