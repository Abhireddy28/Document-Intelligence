import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "Agent 64 — Document Intelligence Agent"
    API_V1_STR: str = "/api"
    MONGODB_URI: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "agent64"
    JWT_SECRET: str = "agent64_super_secret_institutional_key_2026_vignan_hackathon"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    CONFIDENCE_THRESHOLD: float = 0.90
    UPLOAD_DIR: str = str(BASE_DIR / "uploads")
    FRONTEND_URL: str = "http://localhost:5173"
    GEMINI_API_KEY: str = ""
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ENVIRONMENT: str = "development"

    class Config:
        env_file = str(BASE_DIR / ".env")
        extra = "ignore"

settings = Settings()

# Ensure uploads directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
