import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "HASC Backend"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql+asyncpg://user:password@localhost/hasc_db")

    # Uploads
    UPLOAD_DIR: str = "uploads"

    class Config:
        case_sensitive = True

settings = Settings()
