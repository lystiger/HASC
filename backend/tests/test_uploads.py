"""Phase 3: upload and image-processing hardening tests.

These tests use their own clean fixtures (importing ``app`` without the
``import app.models`` rebinding that breaks the shared conftest client) and
create products through the API so all NOT NULL columns are populated. Upload and
temp directories are isolated to a per-test tmp path so cleanup can be asserted.
"""

import json
import os
from io import BytesIO
from pathlib import Path

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from PIL import Image
from sqlalchemy import select

from app.main import app
from app.api.deps import get_db, get_current_user
from app.core.config import settings
from app.models.category import Category as DBCategory
from app.models.product import Product as DBProduct, ProductStatus
from app.models.task import Task as DBTask, TaskStatus, TaskType
from app.models.user import User, UserRole
from app.worker import process_image_task


# --------------------------------------------------------------------------- #
# Image / payload builders
# --------------------------------------------------------------------------- #
def make_image_bytes(fmt: str = "PNG", size=(64, 64), color=(120, 60, 30)) -> bytes:
    buf = BytesIO()
    Image.new("RGB", size, color).save(buf, format=fmt)
    return buf.getvalue()


def make_random_image_bytes(size=(1000, 1000)) -> bytes:
    """A poorly-compressible (random) image, used to exceed a byte-size limit."""
    raw = os.urandom(size[0] * size[1] * 3)
    buf = BytesIO()
    Image.frombytes("RGB", size, raw).save(buf, format="PNG")
    return buf.getvalue()


def image_file(field_name="images", filename="photo.png", data=None, content_type="image/png"):
    if data is None:
        data = make_image_bytes("PNG")
    return (field_name, (filename, data, content_type))


def valid_form(sku="UP-SKU-001", category="FILTERS"):
    return {
        "sku": sku,
        "name": "Upload Test Product",
        "category": category,
        "description": "A product used by upload hardening tests.",
        "specific_attributes": json.dumps({"length": 10}),
    }


# --------------------------------------------------------------------------- #
# Fixtures
# --------------------------------------------------------------------------- #
@pytest_asyncio.fixture
async def admin_client(db_session) -> AsyncClient:
    async def override_get_db():
        yield db_session

    async def override_get_current_user():
        return User(
            id=1,
            email="admin@example.com",
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
async def noauth_client(db_session) -> AsyncClient:
    async def override_get_db():
        yield db_session

    # Start from a clean slate so no admin override leaks in from another test.
    app.dependency_overrides.clear()
    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(base_url="http://test", transport=ASGITransport(app=app)) as client:
        yield client
    app.dependency_overrides.clear()


@pytest.fixture
def upload_dirs(tmp_path, monkeypatch):
    """Isolate temp + permanent upload directories to a tmp path for the test."""
    temp_dir = tmp_path / "temp_uploads"
    uploads_dir = tmp_path / "uploads"
    temp_dir.mkdir()
    uploads_dir.mkdir()
    monkeypatch.setattr(settings, "TEMP_UPLOAD_DIR", str(temp_dir))
    monkeypatch.setattr(settings, "UPLOAD_DIR", str(uploads_dir))
    # The worker captured these at import time; point them at the tmp dirs too.
    monkeypatch.setattr("app.worker.TEMP_UPLOAD_DIR", str(temp_dir), raising=False)
    monkeypatch.setattr("app.worker.PERMANENT_UPLOAD_DIR", str(uploads_dir), raising=False)
    return temp_dir, uploads_dir


async def seed_category(db_session, code="FILTERS"):
    existing = await db_session.execute(select(DBCategory).where(DBCategory.code == code))
    if existing.scalars().first():
        return
    db_session.add(DBCategory(code=code, name_en="Filters", name_vi="Bộ lọc"))
    await db_session.commit()


def temp_files(temp_dir: Path):
    return sorted(p.name for p in Path(temp_dir).iterdir())


# --------------------------------------------------------------------------- #
# Happy path
# --------------------------------------------------------------------------- #
@pytest.mark.asyncio
async def test_valid_image_upload(admin_client, db_session, upload_dirs):
    temp_dir, _ = upload_dirs
    await seed_category(db_session)

    resp = await admin_client.post(
        "/api/v1/products/",
        data=valid_form(sku="UP-VALID-1"),
        files=[image_file(data=make_image_bytes("PNG"))],
    )
    assert resp.status_code == 202
    body = resp.json()
    assert isinstance(body["product_id"], int)
    assert len(body["task_ids"]) == 1
    # Exactly one staged temp file, with a server-controlled name.
    files = temp_files(temp_dir)
    assert len(files) == 1
    assert files[0].startswith("temp_original_") and files[0].endswith(".png")


@pytest.mark.asyncio
async def test_jpeg_and_webp_accepted(admin_client, db_session, upload_dirs):
    await seed_category(db_session)
    for i, fmt in enumerate(("JPEG", "WEBP")):
        resp = await admin_client.post(
            "/api/v1/products/",
            data=valid_form(sku=f"UP-FMT-{i}"),
            files=[image_file(filename=f"p.{fmt.lower()}", data=make_image_bytes(fmt))],
        )
        assert resp.status_code == 202, fmt


@pytest.mark.asyncio
async def test_add_product_images_valid(admin_client, db_session, upload_dirs):
    await seed_category(db_session)
    create = await admin_client.post(
        "/api/v1/products/",
        data=valid_form(sku="UP-ADD-1"),
        files=[image_file(data=make_image_bytes("PNG"))],
    )
    product_id = create.json()["product_id"]

    resp = await admin_client.post(
        f"/api/v1/products/{product_id}/images",
        files=[image_file(data=make_image_bytes("PNG"))],
    )
    assert resp.status_code == 202
    assert len(resp.json()["task_ids"]) == 1


# --------------------------------------------------------------------------- #
# Rejection paths
# --------------------------------------------------------------------------- #
@pytest.mark.asyncio
async def test_corrupt_image_rejected(admin_client, db_session, upload_dirs):
    temp_dir, _ = upload_dirs
    await seed_category(db_session)
    good = make_image_bytes("PNG")
    truncated = good[: len(good) // 2]  # valid header, broken pixel data

    resp = await admin_client.post(
        "/api/v1/products/",
        data=valid_form(sku="UP-CORRUPT"),
        files=[image_file(data=truncated)],
    )
    assert resp.status_code == 400
    assert temp_files(temp_dir) == []  # no partial file left behind


@pytest.mark.asyncio
async def test_unsupported_file_type_rejected(admin_client, db_session, upload_dirs):
    temp_dir, _ = upload_dirs
    await seed_category(db_session)
    # A genuine image, but in a format we do not accept (GIF).
    gif = make_image_bytes("GIF")

    resp = await admin_client.post(
        "/api/v1/products/",
        data=valid_form(sku="UP-GIF"),
        files=[image_file(filename="a.gif", data=gif, content_type="image/gif")],
    )
    assert resp.status_code == 400
    assert temp_files(temp_dir) == []


@pytest.mark.asyncio
async def test_oversized_file_rejected_413(admin_client, db_session, upload_dirs, monkeypatch):
    temp_dir, _ = upload_dirs
    await seed_category(db_session)
    monkeypatch.setattr(settings, "MAX_UPLOAD_SIZE_MB", 1)  # 1 MiB cap
    big = make_random_image_bytes((1000, 1000))  # ~3 MB, incompressible
    assert len(big) > 1024 * 1024

    resp = await admin_client.post(
        "/api/v1/products/",
        data=valid_form(sku="UP-BIG"),
        files=[image_file(data=big)],
    )
    assert resp.status_code == 413
    assert temp_files(temp_dir) == []


@pytest.mark.asyncio
async def test_excessive_file_count_rejected(admin_client, db_session, upload_dirs, monkeypatch):
    temp_dir, _ = upload_dirs
    await seed_category(db_session)
    monkeypatch.setattr(settings, "MAX_IMAGES_PER_REQUEST", 2)

    resp = await admin_client.post(
        "/api/v1/products/",
        data=valid_form(sku="UP-COUNT"),
        files=[image_file(data=make_image_bytes("PNG")) for _ in range(3)],
    )
    assert resp.status_code == 400
    assert temp_files(temp_dir) == []  # count checked before any file is written


@pytest.mark.asyncio
async def test_misleading_extension_and_mime_are_ignored(admin_client, db_session, upload_dirs):
    """Validation is by decoded content, not by filename/Content-Type claims."""
    await seed_category(db_session)

    # (a) Non-image bytes dressed up as a PNG -> rejected despite the claims.
    resp_fake = await admin_client.post(
        "/api/v1/products/",
        data=valid_form(sku="UP-FAKE"),
        files=[image_file(filename="totally.png", data=b"NOT AN IMAGE", content_type="image/png")],
    )
    assert resp_fake.status_code == 400

    # (b) A real PNG mislabelled as text -> accepted, because the bytes are valid.
    resp_real = await admin_client.post(
        "/api/v1/products/",
        data=valid_form(sku="UP-REAL-TXT"),
        files=[image_file(filename="notes.txt", data=make_image_bytes("PNG"), content_type="text/plain")],
    )
    assert resp_real.status_code == 202


@pytest.mark.asyncio
async def test_malicious_filename_is_neutralised(admin_client, db_session, upload_dirs):
    temp_dir, _ = upload_dirs
    await seed_category(db_session)

    resp = await admin_client.post(
        "/api/v1/products/",
        data=valid_form(sku="UP-EVIL"),
        files=[image_file(filename="../../../../etc/passwd", data=make_image_bytes("PNG"))],
    )
    assert resp.status_code == 202
    product_id = resp.json()["product_id"]

    # Every written file is server-named and lives inside the temp dir.
    for name in temp_files(temp_dir):
        assert name.startswith("temp_original_")
        assert ".." not in name and "/" not in name and "passwd" not in name

    # The stored path is inside the temp dir; the display name is path-free.
    tasks = (await db_session.execute(select(DBTask).where(DBTask.product_id == product_id))).scalars().all()
    assert len(tasks) == 1
    stored_path = Path(tasks[0].metadata_["original_image_path"]).resolve()
    assert stored_path.is_relative_to(Path(temp_dir).resolve())
    assert tasks[0].metadata_["original_filename"] == "passwd"


@pytest.mark.asyncio
async def test_decompression_bomb_rejected(admin_client, db_session, upload_dirs, monkeypatch):
    temp_dir, _ = upload_dirs
    await seed_category(db_session)
    monkeypatch.setattr(settings, "MAX_IMAGE_PIXELS", 1000)  # 64x64 = 4096 px > 1000

    resp = await admin_client.post(
        "/api/v1/products/",
        data=valid_form(sku="UP-BOMB"),
        files=[image_file(data=make_image_bytes("PNG", size=(64, 64)))],
    )
    assert resp.status_code == 400
    assert temp_files(temp_dir) == []


@pytest.mark.asyncio
async def test_partial_files_cleaned_when_one_of_many_invalid(admin_client, db_session, upload_dirs):
    """A batch where a later image is invalid must leave NO temp files."""
    temp_dir, _ = upload_dirs
    await seed_category(db_session)
    good = make_image_bytes("PNG")

    resp = await admin_client.post(
        "/api/v1/products/",
        data=valid_form(sku="UP-PARTIAL"),
        files=[
            image_file(filename="good1.png", data=good),
            image_file(filename="good2.png", data=good),
            image_file(filename="bad.png", data=b"NOT AN IMAGE"),
        ],
    )
    assert resp.status_code == 400
    assert temp_files(temp_dir) == []
    # And no product was created (staging happens before the product row).
    count = (await db_session.execute(select(DBProduct).where(DBProduct.sku == "UP-PARTIAL"))).scalars().first()
    assert count is None


# --------------------------------------------------------------------------- #
# Authorization
# --------------------------------------------------------------------------- #
@pytest.mark.asyncio
async def test_upload_requires_authorization(noauth_client, db_session, upload_dirs):
    temp_dir, _ = upload_dirs
    await seed_category(db_session)

    resp = await noauth_client.post(
        "/api/v1/products/",
        data=valid_form(sku="UP-NOAUTH"),
        files=[image_file(data=make_image_bytes("PNG"))],
    )
    assert resp.status_code == 401
    assert temp_files(temp_dir) == []


@pytest.mark.asyncio
async def test_add_images_requires_authorization(noauth_client, db_session, upload_dirs):
    resp = await noauth_client.post(
        "/api/v1/products/1/images",
        files=[image_file(data=make_image_bytes("PNG"))],
    )
    assert resp.status_code == 401


# --------------------------------------------------------------------------- #
# Worker: WebP output + cleanup on success and failure
# --------------------------------------------------------------------------- #
async def _make_product(db_session, sku: str) -> int:
    await seed_category(db_session)
    category = (await db_session.execute(select(DBCategory).where(DBCategory.code == "FILTERS"))).scalars().first()
    product = DBProduct(
        sku=sku,
        name="Worker Test Product",
        name_en="Worker Test Product",
        name_vi="Sản phẩm kiểm thử",
        description_en="EN description",
        description_vi="VI description",
        category_id=category.id,
        status=ProductStatus.DRAFT,
        images=[],
        specific_attributes={},
    )
    db_session.add(product)
    await db_session.commit()
    await db_session.refresh(product)
    return product.id


@pytest.mark.asyncio
async def test_worker_success_produces_webp_and_removes_temp(db_session, upload_dirs):
    temp_dir, uploads_dir = upload_dirs
    product_id = await _make_product(db_session, "WORKER-OK")

    original = Path(temp_dir) / "temp_original_success.png"
    original.write_bytes(make_image_bytes("PNG", size=(400, 300)))

    task = DBTask(
        product_id=product_id,
        task_type=TaskType.IMAGE_PROCESSING,
        status=TaskStatus.PENDING,
        attempts=0,
        max_attempts=3,
        metadata_={
            "product_id": product_id,
            "original_image_path": str(original),
            "original_filename": "success.png",
            "content_type": "image/png",
        },
    )
    db_session.add(task)
    await db_session.commit()
    await db_session.refresh(task)

    await process_image_task(db_session, task)
    await db_session.refresh(task)

    assert task.status == TaskStatus.COMPLETED
    # Product got a WebP web image + thumbnail.
    product = await db_session.get(DBProduct, product_id)
    assert len(product.images) == 1
    web_url = product.images[0]["web_url"]
    thumb_url = product.images[0]["thumb_url"]
    assert web_url.endswith("_web.webp") and thumb_url.endswith("_thumb.webp")

    web_path = Path(uploads_dir) / os.path.basename(web_url)
    thumb_path = Path(uploads_dir) / os.path.basename(thumb_url)
    assert web_path.exists() and thumb_path.exists()
    with Image.open(web_path) as img:
        assert img.format == "WEBP"

    # Temp original cleaned up on success; WebP outputs preserved.
    assert not original.exists()


@pytest.mark.asyncio
async def test_worker_failure_removes_temp_and_marks_failed(db_session, upload_dirs):
    temp_dir, _ = upload_dirs
    product_id = await _make_product(db_session, "WORKER-FAIL")

    bad = Path(temp_dir) / "temp_original_bad.png"
    bad.write_bytes(b"this is not a decodable image")

    task = DBTask(
        product_id=product_id,
        task_type=TaskType.IMAGE_PROCESSING,
        status=TaskStatus.PENDING,
        attempts=0,
        max_attempts=1,  # single attempt -> terminal FAILED on first failure
        metadata_={
            "product_id": product_id,
            "original_image_path": str(bad),
            "original_filename": "bad.png",
            "content_type": "image/png",
        },
    )
    db_session.add(task)
    await db_session.commit()
    await db_session.refresh(task)

    await process_image_task(db_session, task)
    await db_session.refresh(task)

    assert task.status == TaskStatus.FAILED
    assert task.error_message
    # Temp original cleaned up even though processing failed.
    assert not bad.exists()


@pytest.mark.asyncio
async def test_worker_cleanup_is_idempotent(db_session, upload_dirs):
    """A missing temp file on a terminal task must not raise (idempotent cleanup)."""
    temp_dir, _ = upload_dirs
    product_id = await _make_product(db_session, "WORKER-MISSING")

    task = DBTask(
        product_id=product_id,
        task_type=TaskType.IMAGE_PROCESSING,
        status=TaskStatus.PENDING,
        attempts=0,
        max_attempts=1,
        metadata_={
            "product_id": product_id,
            "original_image_path": str(Path(temp_dir) / "does_not_exist.png"),
            "original_filename": "missing.png",
            "content_type": "image/png",
        },
    )
    db_session.add(task)
    await db_session.commit()
    await db_session.refresh(task)

    # Should complete without raising despite the missing file.
    await process_image_task(db_session, task)
    await db_session.refresh(task)
    assert task.status == TaskStatus.FAILED
