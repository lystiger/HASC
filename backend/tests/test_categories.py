import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy import delete

from app.main import app
from app.api.deps import get_db, get_current_user
from app.models.category import Category as DBCategory
from app.models.product import Product as DBProduct, ProductStatus
from app.models.user import User, UserRole


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

@pytest_asyncio.fixture
async def async_client_noauth(db_session) -> AsyncClient:
    async def override_get_db():
        yield db_session

    app.dependency_overrides.pop(get_current_user, None)
    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(base_url="http://test", transport=ASGITransport(app=app)) as client:
        yield client

    app.dependency_overrides.clear()


async def _seed_categories(db_session):
    await db_session.execute(delete(DBCategory))
    await db_session.execute(delete(DBProduct))
    await db_session.commit()

    db_session.add_all(
        [
            DBCategory(code="PACKAGING", name_en="Packaging", name_vi="Bao bì"),
            DBCategory(code="FILTERS", name_en="Filters", name_vi="Bộ lọc"),
            DBCategory(code="CHEMICALS", name_en="Chemicals", name_vi="Hóa chất"),
        ]
    )
    await db_session.commit()


async def _seed_category_with_product(db_session):
    await _seed_categories(db_session)
    category = await db_session.execute(
        DBCategory.__table__.select().where(DBCategory.code == "PACKAGING").limit(1)
    )
    row = category.first()
    category_id = row.id

    db_session.add(
        DBProduct(
            sku="SKU-LOCK-001",
            name="Locked Product",
            category_id=category_id,
            status=ProductStatus.DRAFT,
            images=[],
            specific_attributes={},
        )
    )
    await db_session.commit()
    return category_id


@pytest.mark.asyncio
async def test_list_categories(async_client_auth, db_session):
    await _seed_categories(db_session)
    resp = await async_client_auth.get("/api/v1/categories")
    assert resp.status_code == 200
    data = resp.json()
    codes = [c["code"] for c in data]
    assert codes == sorted(codes)
    assert set(codes) == {"PACKAGING", "FILTERS", "CHEMICALS"}


@pytest.mark.asyncio
async def test_create_category(async_client_auth, db_session):
    await _seed_categories(db_session)
    resp = await async_client_auth.post(
        "/api/v1/categories",
        json={"code": "EQUIPMENT", "name_en": "Equipment", "name_vi": "Thiết bị"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["code"] == "EQUIPMENT"


@pytest.mark.asyncio
async def test_create_category_duplicate(async_client_auth, db_session):
    await _seed_categories(db_session)
    resp = await async_client_auth.post(
        "/api/v1/categories",
        json={"code": "PACKAGING", "name_en": "Packaging", "name_vi": "Bao bì"},
    )
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_get_category(async_client_auth, db_session):
    await _seed_categories(db_session)
    resp = await async_client_auth.get("/api/v1/categories")
    category_id = resp.json()[0]["id"]

    resp = await async_client_auth.get(f"/api/v1/categories/{category_id}")
    assert resp.status_code == 200
    assert resp.json()["id"] == category_id


@pytest.mark.asyncio
async def test_update_category(async_client_auth, db_session):
    await _seed_categories(db_session)
    resp = await async_client_auth.get("/api/v1/categories")
    category_id = resp.json()[0]["id"]

    resp = await async_client_auth.put(
        f"/api/v1/categories/{category_id}",
        json={"name_en": "Packaging Updated"},
    )
    assert resp.status_code == 200
    assert resp.json()["name_en"] == "Packaging Updated"


@pytest.mark.asyncio
async def test_delete_category(async_client_auth, db_session):
    await _seed_categories(db_session)
    resp = await async_client_auth.get("/api/v1/categories")
    category_id = resp.json()[0]["id"]

    resp = await async_client_auth.delete(f"/api/v1/categories/{category_id}")
    assert resp.status_code == 204


@pytest.mark.asyncio
async def test_delete_category_in_use_returns_409(async_client_auth, db_session):
    category_id = await _seed_category_with_product(db_session)
    resp = await async_client_auth.delete(f"/api/v1/categories/{category_id}")
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_categories_require_auth(async_client_noauth, db_session):
    await _seed_categories(db_session)
    resp = await async_client_noauth.get("/api/v1/categories")
    assert resp.status_code == 401
