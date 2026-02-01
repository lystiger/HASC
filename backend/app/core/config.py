import os
from pydantic_settings import BaseSettings
from pydantic import ConfigDict # Import ConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "HASC Backend"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = "51a7e0eafa586be880a06da122600b4c957f8ef4f6aa340c5e0fe2ece7c2bf27"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8 # 8 days
    ALGORITHM: str = "HS256"

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql+asyncpg://user:password@localhost/hasc_db")

    # Uploads
    UPLOAD_DIR: str = "uploads"

    model_config = ConfigDict(case_sensitive=True) # Use ConfigDict

settings = Settings()
