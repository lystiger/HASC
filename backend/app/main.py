import asyncio
import mimetypes
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
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
    return {"status": "ok"}
