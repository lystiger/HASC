import os
from pydantic_settings import BaseSettings
from pydantic import ConfigDict # Import ConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "HASC Backend"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql+asyncpg://user:password@localhost/hasc_db")

    # Uploads
    UPLOAD_DIR: str = "uploads"

    model_config = ConfigDict(case_sensitive=True) # Use ConfigDict

settings = Settings()
