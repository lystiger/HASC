import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from pydantic import ValidationError

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
    # Required. There is deliberately no default: the application must refuse to
    # start rather than sign tokens with a predictable, publicly-known key.
    # Provide it via the SECRET_KEY environment variable (see .env.example).
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8 # 8 days
    ALGORITHM: str = "HS256"

    @field_validator("SECRET_KEY")
    @classmethod
    def _secret_key_must_be_set(cls, value: str) -> str:
        if not value or not value.strip():
            raise ValueError("must be a non-empty value")
        return value

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

    # case_sensitive keeps env var names matching the field names exactly.
    # env_file lets local development supply values from a .env file (ignored in
    # containers, which receive their configuration directly from the environment);
    # extra="ignore" tolerates the unrelated compose variables that live alongside it.
    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


try:
    settings = Settings()
except ValidationError as exc:
    # Fail loudly and clearly, without echoing any provided value (which could be
    # a secret), if SECRET_KEY is missing/empty.
    if any(error.get("loc") == ("SECRET_KEY",) for error in exc.errors()):
        raise RuntimeError(
            "SECRET_KEY is not set. The application refuses to start with an "
            "insecure default. Set the SECRET_KEY environment variable to a "
            "strong random value (e.g. `openssl rand -hex 32`); see .env.example."
        ) from None
    raise
