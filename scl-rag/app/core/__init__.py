"""Application Configuration Settings."""

from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """RAG service settings loaded from environment variables."""

    # Application
    APP_NAME: str = "scl-rag-service"
    APP_ENV: str = "development"
    DEBUG: bool = True

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 4003

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:4001", "http://localhost:4002", "http://localhost:5173"]

    # Milvus
    MILVUS_HOST: str = "localhost"
    MILVUS_PORT: int = 19530
    MILVUS_COLLECTION_NAME: str = "student_results"
    MILVUS_DB_NAME: str = "default"

    # Embedding model
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    EMBEDDING_DIMENSION: int = 384

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
