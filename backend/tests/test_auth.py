import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from jose import jwt
from sqlalchemy import delete

from app.main import app
from app.api.deps import get_db
from app.core.config import settings
from app.crud import crud_user
from app.models.user import User, UserRole
from app.schemas.user import UserCreate


@pytest_asyncio.fixture
async def async_client_authless(db_session) -> AsyncClient:
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(base_url="http://test", transport=ASGITransport(app=app)) as client:
        yield client
    app.dependency_overrides.clear()


async def _seed_user(db_session, email: str, password: str, role: UserRole = UserRole.ADMIN):
    await db_session.execute(delete(User))
    await db_session.commit()
    user_in = UserCreate(
        email=email,
        password=password,
        full_name="Test Admin",
        role=role,
    )
    return await crud_user.create_user(db_session, obj_in=user_in)


@pytest.mark.asyncio
async def test_login_returns_token_with_role(async_client_authless, db_session):
    user = await _seed_user(db_session, "admin@example.com", "strong-password")

    resp = await async_client_authless.post(
        f"{settings.API_V1_STR}/login/access-token",
        data={"username": "admin@example.com", "password": "strong-password"},
    )
    assert resp.status_code == 200
    payload = resp.json()
    assert "access_token" in payload
    assert payload["token_type"] == "bearer"

    decoded = jwt.decode(
        payload["access_token"], settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
    )
    assert decoded["sub"] == str(user.id)
    assert decoded["role"] == UserRole.ADMIN.value


@pytest.mark.asyncio
async def test_login_invalid_credentials(async_client_authless, db_session):
    await _seed_user(db_session, "admin@example.com", "strong-password")
    resp = await async_client_authless.post(
        f"{settings.API_V1_STR}/login/access-token",
        data={"username": "admin@example.com", "password": "wrong-password"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_user_role_cannot_create_category(async_client_authless, db_session):
    await _seed_user(db_session, "user@example.com", "user-password", role=UserRole.USER)
    login = await async_client_authless.post(
        f"{settings.API_V1_STR}/login/access-token",
        data={"username": "user@example.com", "password": "user-password"},
    )
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = await async_client_authless.post(
        f"{settings.API_V1_STR}/categories",
        json={"name": "NEW-CAT"},
        headers=headers,
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_user_role_can_list_categories(async_client_authless, db_session):
    await _seed_user(db_session, "user@example.com", "user-password", role=UserRole.USER)
    login = await async_client_authless.post(
        f"{settings.API_V1_STR}/login/access-token",
        data={"username": "user@example.com", "password": "user-password"},
    )
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = await async_client_authless.get(
        f"{settings.API_V1_STR}/categories",
        headers=headers,
    )
    assert resp.status_code == 200
