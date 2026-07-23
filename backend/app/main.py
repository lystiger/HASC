import asyncio
import mimetypes
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, status
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.core.config import settings
from app.db.session import engine
from app.api.v1.api import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    worker_task = None
    if settings.RUN_EMBEDDED_WORKER:
        from app.worker import worker_main

        worker_task = asyncio.create_task(worker_main())
    yield
    if worker_task is not None:
        worker_task.cancel()
        try:
            await worker_task
        except asyncio.CancelledError:
            pass


app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

# Serve uploaded images as static files
# (slim base images ship without a system mime database, so register webp explicitly)
mimetypes.add_type("image/webp", ".webp")
uploads_path = Path(settings.UPLOAD_DIR)
uploads_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_path)), name="uploads")

@app.get("/")
def read_root():
    return {"message": f"Welcome to the {settings.PROJECT_NAME} API"}


@app.get("/health")
def health_check():
    """Backward-compatible liveness endpoint (kept so existing probes keep working)."""
    return {"status": "ok"}


@app.get("/health/live")
def health_live():
    """Liveness: the process is up and able to serve requests. No dependencies."""
    return {"status": "alive"}


async def _check_database() -> bool:
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception:
        # Deliberately swallow the exception detail: DB errors can contain the
        # connection string (including credentials). We only surface pass/fail.
        return False


def _check_upload_dir_writable(directory: str) -> bool:
    try:
        path = Path(directory)
        path.mkdir(parents=True, exist_ok=True)
        probe = path / f".readiness_probe_{uuid.uuid4().hex}"
        probe.write_bytes(b"ok")
        probe.unlink()
        return True
    except Exception:
        return False


@app.get("/health/ready")
async def health_ready():
    """Readiness: verify the dependencies the app needs to actually do work.

    Checks database connectivity and that the upload directories are writable.
    Returns 503 if any check fails so orchestrators hold traffic/dependents back.
    """
    checks = {
        "database": _bool_status(await _check_database()),
        "uploads_writable": _bool_status(_check_upload_dir_writable(settings.UPLOAD_DIR)),
        "temp_uploads_writable": _bool_status(
            _check_upload_dir_writable(settings.TEMP_UPLOAD_DIR)
        ),
    }
    ready = all(value == "ok" for value in checks.values())
    payload = {"status": "ready" if ready else "not ready", "checks": checks}
    if not ready:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, content=payload
        )
    return payload


def _bool_status(ok: bool) -> str:
    return "ok" if ok else "error"
