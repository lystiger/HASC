import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy import delete

from app.main import app
from app.api.deps import get_db, get_current_user
from app.models.product import Product as DBProduct, ProductCategory, ProductStatus
from app.models.user import User, UserRole

@pytest_asyncio.fixture
async def async_client_noauth(db_session) -> AsyncClient:
    async def override_get_db():
        yield db_session

    # Ensure no auth override leaks into this fixture
    app.dependency_overrides.pop(get_current_user, None)
    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(base_url="http://test", transport=ASGITransport(app=app)) as client:
        yield client

    app.dependency_overrides.clear()

@pytest_asyncio.fixture
async def async_client_auth(db_session) -> AsyncClient:
    async def override_get_db():
        yield db_session

    async def override_get_current_user():
        return User(
            id=1,
            email="test@example.com",
            hashed_password="not-used",
            full_name="Test Admin",
            role=UserRole.ADMIN,
        )

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    async with AsyncClient(base_url="http://test", transport=ASGITransport(app=app)) as client:
        yield client

    app.dependency_overrides.clear()


async def _seed_products(db_session):
    # Clean slate
    await db_session.execute(delete(DBProduct))
    await db_session.commit()

    p1 = DBProduct(
        sku="SKU-001",
        name="Packaging Film",
        category=ProductCategory.PACKAGING,
        status=ProductStatus.PUBLISHED,
        images=[],
        specific_attributes={"thickness": 100},
    )
    p2 = DBProduct(
        sku="SKU-002",
        name="Filter Paper",
        category=ProductCategory.FILTERS,
        status=ProductStatus.DRAFT,
        images=[],
        specific_attributes={"efficiency": 95},
    )
    p3 = DBProduct(
        sku="SKU-003",
        name="Chemical Solvent",
        category=ProductCategory.CHEMICALS,
        status=ProductStatus.PUBLISHED,
        images=[],
        specific_attributes={"volume": 5},
    )

    db_session.add_all([p1, p2, p3])
    await db_session.commit()


@pytest.mark.asyncio
async def test_list_products_no_filters(async_client_auth, db_session):
    await _seed_products(db_session)
    resp = await async_client_auth.get("/api/v1/products")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 3


@pytest.mark.asyncio
async def test_filter_by_category(async_client_auth, db_session):
    await _seed_products(db_session)
    resp = await async_client_auth.get("/api/v1/products?category=PACKAGING")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["sku"] == "SKU-001"


@pytest.mark.asyncio
async def test_filter_by_status(async_client_auth, db_session):
    await _seed_products(db_session)
    resp = await async_client_auth.get("/api/v1/products?status=DRAFT")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["sku"] == "SKU-002"


@pytest.mark.asyncio
async def test_filter_by_sku(async_client_auth, db_session):
    await _seed_products(db_session)
    resp = await async_client_auth.get("/api/v1/products?sku=SKU-003")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["name"] == "Chemical Solvent"


@pytest.mark.asyncio
async def test_filter_by_name_partial_case_insensitive(async_client_auth, db_session):
    await _seed_products(db_session)
    resp = await async_client_auth.get("/api/v1/products?name=film")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["sku"] == "SKU-001"


@pytest.mark.asyncio
async def test_filter_combined(async_client_auth, db_session):
    await _seed_products(db_session)
    resp = await async_client_auth.get("/api/v1/products?category=CHEMICALS&status=PUBLISHED")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["sku"] == "SKU-003"


@pytest.mark.asyncio
async def test_filter_unknown_returns_empty(async_client_auth, db_session):
    await _seed_products(db_session)
    resp = await async_client_auth.get("/api/v1/products?sku=NOPE-123")
    assert resp.status_code == 200
    data = resp.json()
    assert data == []


@pytest.mark.asyncio
async def test_invalid_category_returns_422(async_client_auth, db_session):
    await _seed_products(db_session)
    resp = await async_client_auth.get("/api/v1/products?category=NOT_A_CATEGORY")
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_invalid_status_returns_422(async_client_auth, db_session):
    await _seed_products(db_session)
    resp = await async_client_auth.get("/api/v1/products?status=NOT_A_STATUS")
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_list_products_requires_auth(async_client_noauth, db_session):
    await _seed_products(db_session)
    resp = await async_client_noauth.get("/api/v1/products")
    assert resp.status_code == 401
