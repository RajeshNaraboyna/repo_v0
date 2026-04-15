"""Application Configuration Settings."""

from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Application
    APP_NAME: str = "school-management-api"
    APP_ENV: str = "development"
    DEBUG: bool = True
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 4002
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./school_mgmt.db"
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ALGORITHM: str = "HS256"
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:4001", "http://localhost:5173"]
    
    # RAG Service
    RAG_SERVICE_URL: str = "http://localhost:4003"

    # Guest User
    GUEST_ACCESS_ENABLED: bool = True
    GUEST_TOKEN_EXPIRE_MINUTES: int = 60
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
