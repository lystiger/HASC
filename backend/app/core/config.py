import os
from pydantic_settings import BaseSettings
from pydantic import ConfigDict, field_validator # Import ConfigDict

DEFAULT_CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]


def _normalize_database_url(url: str) -> str:
    """Ensure the async driver is used (Railway/Heroku provide plain postgresql:// URLs)."""
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    if url.startswith("postgresql://"):
        url = "postgresql+asyncpg://" + url[len("postgresql://"):]
    return url


def _parse_cors_origins(raw: str) -> list[str]:
    origins = [origin.strip() for origin in raw.split(",") if origin.strip()]
    return origins or DEFAULT_CORS_ORIGINS


class Settings(BaseSettings):
    PROJECT_NAME: str = "HASC Backend"
    API_V1_STR: str = "/api/v1"

    # Security
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY",
        "51a7e0eafa586be880a06da122600b4c957f8ef4f6aa340c5e0fe2ece7c2bf27",
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8 # 8 days
    ALGORITHM: str = "HS256"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost/hasc_db"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def _ensure_async_driver(cls, value: str) -> str:
        return _normalize_database_url(value)

    # CORS (comma-separated origins, e.g. "https://app.example.com,https://admin.example.com")
    BACKEND_CORS_ORIGINS: str = os.getenv("BACKEND_CORS_ORIGINS", "")

    # Uploads
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "backend/uploads")
    TEMP_UPLOAD_DIR: str = os.getenv("TEMP_UPLOAD_DIR", "backend/temp_uploads")
    WORKER_POLL_INTERVAL: int = 5 # seconds

    # Run the image-processing worker inside the API process (single-service deployments
    # such as Railway, where the uploads volume can only be attached to one service).
    RUN_EMBEDDED_WORKER: bool = os.getenv("RUN_EMBEDDED_WORKER", "false").lower() in ("1", "true", "yes")

    @property
    def cors_origins(self) -> list[str]:
        return _parse_cors_origins(self.BACKEND_CORS_ORIGINS)

    model_config = ConfigDict(case_sensitive=True) # Use ConfigDict

settings = Settings()
