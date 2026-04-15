"""API routes for the RAG service."""

from fastapi import APIRouter, HTTPException

from app.schemas import (
    IndexStudentResultsRequest,
    IndexResponse,
    QueryRequest,
    QueryResponse,
    CollectionStats,
    DeleteResponse,
    AnalyticsQueryRequest,
    AnalyticsQueryResponse,
    AnalyticsFiltersResponse,
)
from app.services.indexing import index_student_results, remove_student_index
from app.services.query import query_student_results
from app.services.analytics import run_analytics_query, get_analytics_filters
from app.services.vectordb import get_collection_count
from app.core import settings

router = APIRouter()


# ── Index student results ─────────────────────────────────────

@router.post("/index/student-results", response_model=IndexResponse)
async def index_results(data: IndexStudentResultsRequest):
    """Index a student's exam results into the vector store.

    Each subject result is stored as a separate document with rich
    metadata (student info, exam info, marks, grades) for
    semantic retrieval.
    """
    try:
        return index_student_results(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Indexing failed: {str(e)}")


# ── Query indexed results ─────────────────────────────────────

@router.post("/query", response_model=QueryResponse)
async def query_results(data: QueryRequest):
    """Semantic search over indexed student results.

    Supports optional filters by student_id, class_name, or exam_id.
    """
    try:
        return query_student_results(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")


# ── Collection statistics ─────────────────────────────────────

@router.get("/index/stats", response_model=CollectionStats)
async def collection_stats():
    """Get vector collection statistics."""
    return CollectionStats(
        collection_name=settings.MILVUS_COLLECTION_NAME,
        total_documents=get_collection_count(),
        embedding_model=settings.EMBEDDING_MODEL,
    )


# ── Delete student index ──────────────────────────────────────

@router.delete("/index/student/{student_id}", response_model=DeleteResponse)
async def delete_student_index(student_id: str):
    """Remove all indexed documents for a student."""
    try:
        count = remove_student_index(student_id)
        return DeleteResponse(
            success=True,
            message=f"Removed {count} documents for student {student_id}",
            documents_deleted=count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Deletion failed: {str(e)}")


# ── Analytics: Structured query + aggregation ─────────────────

@router.post("/analytics/query", response_model=AnalyticsQueryResponse)
async def analytics_query(data: AnalyticsQueryRequest):
    """Run an analytics query over indexed student results.

    Supports free-text semantic search combined with structured
    filters (class, subject, exam, marks range, grade).
    Returns paginated results with aggregated summary statistics.
    """
    try:
        return run_analytics_query(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analytics query failed: {str(e)}")


@router.get("/analytics/filters", response_model=AnalyticsFiltersResponse)
async def analytics_filters():
    """Get available filter values for the analytics UI.

    Returns distinct classes, subjects, exam types, and academic years
    that exist in the indexed data.
    """
    try:
        return get_analytics_filters()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch filters: {str(e)}")
