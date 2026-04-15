"""Pydantic schemas for the RAG service."""

from typing import Optional, List
from pydantic import BaseModel, Field


# ── Index Request Schemas ──────────────────────────────────────

class StudentResultDocument(BaseModel):
    """A single subject result to be indexed."""
    result_id: int
    subject: str
    marks_obtained: Optional[float] = None
    max_marks: float = 100
    grade: Optional[str] = None
    remarks: Optional[str] = None
    has_pdf: bool = False
    pdf_filename: Optional[str] = None


class IndexStudentResultsRequest(BaseModel):
    """Request to index all results for a student in an exam."""
    student_id: str = Field(..., min_length=1)
    student_name: str = Field(..., min_length=1)
    class_name: str = Field(..., min_length=1)
    roll_number: Optional[str] = None
    exam_id: int
    exam_name: str
    exam_type: str
    academic_year: str
    exam_date: Optional[str] = None
    results: List[StudentResultDocument] = Field(..., min_length=1)


# ── Index Response Schemas ─────────────────────────────────────

class IndexResponse(BaseModel):
    """Response after indexing operation."""
    success: bool
    message: str
    documents_indexed: int = 0
    student_id: str
    index_name: str


# ── Query Schemas ──────────────────────────────────────────────

class QueryRequest(BaseModel):
    """Request to query the indexed data."""
    query: str = Field(..., min_length=1)
    n_results: int = Field(default=10, ge=1, le=100)
    student_id: Optional[str] = None  # Optional filter by student
    class_name: Optional[str] = None  # Optional filter by class
    exam_id: Optional[int] = None  # Optional filter by exam


class QueryResultItem(BaseModel):
    """A single query result."""
    document: str
    metadata: dict
    distance: Optional[float] = None


class QueryResponse(BaseModel):
    """Response from a query."""
    query: str
    results: List[QueryResultItem]
    total_results: int


# ── Stats Schema ───────────────────────────────────────────────

class CollectionStats(BaseModel):
    """Vector collection statistics."""
    collection_name: str
    total_documents: int
    embedding_model: str


# ── Delete Response ────────────────────────────────────────────

class DeleteResponse(BaseModel):
    """Response after deletion."""
    success: bool
    message: str
    documents_deleted: int = 0


# ── Analytics Schemas ──────────────────────────────────────────

class AnalyticsQueryRequest(BaseModel):
    """Request to run an analytics query on indexed student results."""
    query: str = Field(default="", description="Free-text semantic search (optional)")
    student_id: Optional[str] = None
    student_name: Optional[str] = None
    class_name: Optional[str] = None
    subject: Optional[str] = None
    exam_id: Optional[int] = None
    exam_type: Optional[str] = None
    academic_year: Optional[str] = None
    min_marks: Optional[float] = None
    max_marks_filter: Optional[float] = None
    grade: Optional[str] = None
    sort_by: str = Field(default="relevance", description="relevance | marks_asc | marks_desc | student_name | subject")
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


class AnalyticsResultItem(BaseModel):
    """A single analytics result row."""
    result_id: int
    student_id: str
    student_name: str
    class_name: str
    roll_number: Optional[str] = None
    exam_id: int
    exam_name: str
    exam_type: str
    academic_year: str
    subject: str
    marks_obtained: Optional[float] = None
    max_marks: float
    percentage: Optional[float] = None
    grade: Optional[str] = None
    has_pdf: bool = False
    relevance_score: Optional[float] = None
    document: Optional[str] = None


class AnalyticsSummary(BaseModel):
    """Aggregated analytics summary."""
    total_records: int
    unique_students: int
    unique_subjects: int
    unique_exams: int
    average_percentage: Optional[float] = None
    highest_percentage: Optional[float] = None
    lowest_percentage: Optional[float] = None
    grade_distribution: dict = Field(default_factory=dict)
    subject_averages: dict = Field(default_factory=dict)
    class_averages: dict = Field(default_factory=dict)


class AnalyticsQueryResponse(BaseModel):
    """Response from an analytics query."""
    results: List[AnalyticsResultItem]
    summary: AnalyticsSummary
    total_results: int
    page: int
    page_size: int
    total_pages: int
    kb_documents: List[str] = Field(
        default_factory=list,
        description="Raw knowledge-base document texts returned by the vector search",
    )


class AnalyticsFiltersResponse(BaseModel):
    """Available filter values for the analytics UI."""
    classes: List[str] = Field(default_factory=list)
    subjects: List[str] = Field(default_factory=list)
    exam_types: List[str] = Field(default_factory=list)
    academic_years: List[str] = Field(default_factory=list)
    grades: List[str] = Field(default_factory=list)
