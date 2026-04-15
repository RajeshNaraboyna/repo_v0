"""SCL RAG Service — Main Application Entry Point.

A RAG (Retrieval-Augmented Generation) service for indexing and querying
student exam results. Modeled after the sample-knowledge service architecture.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core import settings
from app.api.routes import router as api_router

app = FastAPI(
    title="SCL RAG Service",
    description="RAG service for indexing and querying student exam results",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes
app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": settings.APP_NAME}


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "SCL RAG Service — Student Results Indexing & Retrieval",
        "docs": "/docs",
        "health": "/health",
    }
