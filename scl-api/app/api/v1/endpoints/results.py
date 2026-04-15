"""Student results endpoints – upload marks, attach PDFs, drill-down views."""

from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.auth import get_current_user
from app.db.session import get_db
from app.schemas.result import (
    StudentResultCreate,
    StudentResultUpdate,
    StudentResultResponse,
    ResultExamSummary,
    ResultClassSummary,
    ResultStudentSummary,
)
from app.services.result_service import (
    get_result_exams,
    get_result_classes,
    get_result_students,
    get_student_results,
    upsert_result,
    upload_result_pdf,
    upload_student_pdf,
    get_result_pdf,
    delete_result,
)
from app.services.rag_service import index_student_results_to_rag, query_rag, query_analytics, get_analytics_filters

router = APIRouter()


def _require_staff(current_user: Optional[dict]):
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if current_user.get("role") not in ["admin", "staff"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only staff members can perform this action",
        )


# ── Drill-down: Exams ─────────────────────────────────────────

@router.get("/exams", response_model=List[ResultExamSummary])
async def list_result_exams(
    academic_year: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user),
):
    """List exams for the results module."""
    _require_staff(current_user)
    return await get_result_exams(db, academic_year=academic_year)


# ── Drill-down: Classes within an exam ─────────────────────────

@router.get("/exams/{exam_id}/classes", response_model=List[ResultClassSummary])
async def list_result_classes(
    exam_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user),
):
    """List classes that belong to an exam with result counts."""
    _require_staff(current_user)
    return await get_result_classes(db, exam_id)


# ── Drill-down: Students within an exam+class ─────────────────

@router.get("/exams/{exam_id}/classes/{class_name}/students", response_model=List[ResultStudentSummary])
async def list_result_students(
    exam_id: int,
    class_name: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user),
):
    """List students of a class with result summaries."""
    _require_staff(current_user)
    return await get_result_students(db, exam_id, class_name)


# ── Student's subject results ─────────────────────────────────

@router.get(
    "/exams/{exam_id}/classes/{class_name}/students/{student_id}",
    response_model=List[StudentResultResponse],
)
async def list_student_results(
    exam_id: int,
    class_name: str,
    student_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user),
):
    """Get all subject results for a single student."""
    _require_staff(current_user)
    return await get_student_results(db, exam_id, class_name, student_id)


# ── Create / update result (marks) ────────────────────────────

@router.post("", response_model=StudentResultResponse, status_code=status.HTTP_201_CREATED)
async def create_or_update_result(
    data: StudentResultCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user),
):
    """Create or update marks for a student+exam+subject."""
    _require_staff(current_user)
    return await upsert_result(
        db, data,
        uploaded_by=current_user.get("sub") if current_user else None,
    )


# ── Upload PDF to an existing result ──────────────────────────

@router.post("/{result_id}/pdf", response_model=StudentResultResponse)
async def upload_pdf_to_result(
    result_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user),
):
    """Upload (or replace) a PDF for an existing result row."""
    _require_staff(current_user)
    if file.content_type not in ("application/pdf",):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")
    pdf_bytes = await file.read()
    try:
        return await upload_result_pdf(
            db, result_id, pdf_bytes, file.filename or "result.pdf",
            file.content_type or "application/pdf",
            uploaded_by=current_user.get("sub") if current_user else None,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ── Upload PDF directly for student+exam+subject ─────────────

@router.post("/upload-pdf", response_model=StudentResultResponse)
async def upload_pdf_for_student(
    exam_id: int = Form(...),
    student_id: str = Form(...),
    class_name: str = Form(...),
    subject: str = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user),
):
    """Upload a PDF (creates result row if needed)."""
    _require_staff(current_user)
    if file.content_type not in ("application/pdf",):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")
    pdf_bytes = await file.read()
    return await upload_student_pdf(
        db, exam_id, student_id, class_name, subject,
        pdf_bytes, file.filename or "result.pdf",
        file.content_type or "application/pdf",
        uploaded_by=current_user.get("sub") if current_user else None,
    )


# ── Download PDF ──────────────────────────────────────────────

@router.get("/{result_id}/pdf")
async def download_pdf(
    result_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user),
):
    """Download the PDF attached to a result."""
    _require_staff(current_user)
    pdf = await get_result_pdf(db, result_id)
    if not pdf:
        raise HTTPException(status_code=404, detail="PDF not found")
    data, filename, content_type = pdf
    return Response(
        content=data,
        media_type=content_type,
        headers={"Content-Disposition": f'inline; filename="{filename}"'},
    )


# ── Delete result ─────────────────────────────────────────────

@router.delete("/{result_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_result_endpoint(
    result_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user),
):
    """Delete a result entry."""
    _require_staff(current_user)
    deleted = await delete_result(db, result_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Result not found")


# ── RAG: Index student results ────────────────────────────────

@router.post(
    "/exams/{exam_id}/classes/{class_name}/students/{student_id}/index-to-rag",
)
async def index_to_rag(
    exam_id: int,
    class_name: str,
    student_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user),
):
    """Index all results for a student into the RAG service.

    Collects student info, exam info, and all subject results,
    then sends them to the RAG vector store for semantic indexing.
    """
    _require_staff(current_user)
    try:
        result = await index_student_results_to_rag(db, exam_id, student_id, class_name)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"RAG service error: {str(e)}",
        )


# ── RAG: Query student results ────────────────────────────────

@router.post("/rag/query")
async def rag_query(
    query: str = Query(..., min_length=1),
    n_results: int = Query(default=10, ge=1, le=100),
    student_id: Optional[str] = Query(default=None),
    class_name: Optional[str] = Query(default=None),
    exam_id: Optional[int] = Query(default=None),
    current_user: Optional[dict] = Depends(get_current_user),
):
    """Query the RAG service for indexed student results."""
    _require_staff(current_user)
    try:
        result = await query_rag(
            query=query,
            n_results=n_results,
            student_id=student_id,
            class_name=class_name,
            exam_id=exam_id,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"RAG service error: {str(e)}",
        )


# ── Analytics: Structured query + aggregation ─────────────────

@router.post("/analytics/query")
async def analytics_query(
    query: str = Query(default=""),
    student_id: Optional[str] = Query(default=None),
    student_name: Optional[str] = Query(default=None),
    class_name: Optional[str] = Query(default=None),
    subject: Optional[str] = Query(default=None),
    exam_id: Optional[int] = Query(default=None),
    exam_type: Optional[str] = Query(default=None),
    academic_year: Optional[str] = Query(default=None),
    min_marks: Optional[float] = Query(default=None),
    max_marks_filter: Optional[float] = Query(default=None),
    grade: Optional[str] = Query(default=None),
    sort_by: str = Query(default="relevance"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: Optional[dict] = Depends(get_current_user),
):
    """Run an analytics query on indexed student results.

    Supports free-text semantic search combined with structured
    filters. Returns paginated results with summary statistics.
    """
    _require_staff(current_user)
    try:
        result = await query_analytics(
            query=query,
            student_id=student_id,
            student_name=student_name,
            class_name=class_name,
            subject=subject,
            exam_id=exam_id,
            exam_type=exam_type,
            academic_year=academic_year,
            min_marks=min_marks,
            max_marks_filter=max_marks_filter,
            grade=grade,
            sort_by=sort_by,
            page=page,
            page_size=page_size,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"RAG analytics error: {str(e)}",
        )


@router.get("/analytics/filters")
async def analytics_filters_endpoint(
    current_user: Optional[dict] = Depends(get_current_user),
):
    """Get available filter values for the analytics UI."""
    _require_staff(current_user)
    try:
        return await get_analytics_filters()
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"RAG analytics error: {str(e)}",
        )
