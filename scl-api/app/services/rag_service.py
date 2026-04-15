"""RAG service integration — sends student result data to the RAG service for indexing."""

import logging
from typing import Optional, List

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import StudentResult, Exam, AdmissionRequest
from app.core.config import settings

logger = logging.getLogger(__name__)


async def index_student_results_to_rag(
    db: AsyncSession,
    exam_id: int,
    student_id: str,
    class_name: str,
) -> dict:
    """Collect all results for a student in an exam and send to the RAG service.

    Gathers student info, exam info, and all subject results, then
    posts to the RAG service's indexing endpoint.

    Returns:
        Response dict from the RAG service.
    """
    # 1. Get the exam details
    exam_result = await db.execute(
        select(Exam).where(Exam.id == exam_id)
    )
    exam = exam_result.scalar_one_or_none()
    if not exam:
        raise ValueError(f"Exam {exam_id} not found")

    # 2. Get the student details
    student_result = await db.execute(
        select(AdmissionRequest).where(AdmissionRequest.id == student_id)
    )
    student = student_result.scalar_one_or_none()
    if not student:
        raise ValueError(f"Student {student_id} not found")

    # 3. Get all results for this student in this exam
    results_query = await db.execute(
        select(StudentResult).where(
            StudentResult.exam_id == exam_id,
            StudentResult.student_id == student_id,
            StudentResult.class_name == class_name,
        ).order_by(StudentResult.subject)
    )
    results = results_query.scalars().all()

    if not results:
        raise ValueError(f"No results found for student {student_id} in exam {exam_id}")

    # 4. Build the RAG indexing payload
    result_docs = []
    for r in results:
        result_docs.append({
            "result_id": r.id,
            "subject": r.subject,
            "marks_obtained": r.marks_obtained,
            "max_marks": r.max_marks,
            "grade": r.grade,
            "remarks": r.remarks,
            "has_pdf": r.pdf_data is not None and len(r.pdf_data) > 0 if r.pdf_data else False,
            "pdf_filename": r.pdf_filename,
        })

    payload = {
        "student_id": student_id,
        "student_name": student.student_name,
        "class_name": class_name,
        "roll_number": student.roll_number,
        "exam_id": exam_id,
        "exam_name": exam.name,
        "exam_type": exam.exam_type,
        "academic_year": exam.academic_year,
        "exam_date": str(exam.exam_date) if exam.exam_date else None,
        "results": result_docs,
    }

    # 5. Send to RAG service
    rag_url = f"{settings.RAG_SERVICE_URL}/api/v1/index/student-results"
    logger.info(f"Sending {len(result_docs)} results to RAG service for student {student_id}")

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(rag_url, json=payload)
        response.raise_for_status()
        return response.json()


async def query_rag(
    query: str,
    n_results: int = 10,
    student_id: Optional[str] = None,
    class_name: Optional[str] = None,
    exam_id: Optional[int] = None,
) -> dict:
    """Query the RAG service for student results.

    Returns:
        Response dict from the RAG service.
    """
    payload = {
        "query": query,
        "n_results": n_results,
    }
    if student_id:
        payload["student_id"] = student_id
    if class_name:
        payload["class_name"] = class_name
    if exam_id:
        payload["exam_id"] = exam_id

    rag_url = f"{settings.RAG_SERVICE_URL}/api/v1/query"

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(rag_url, json=payload)
        response.raise_for_status()
        return response.json()


async def query_analytics(
    query: str = "",
    student_id: Optional[str] = None,
    student_name: Optional[str] = None,
    class_name: Optional[str] = None,
    subject: Optional[str] = None,
    exam_id: Optional[int] = None,
    exam_type: Optional[str] = None,
    academic_year: Optional[str] = None,
    min_marks: Optional[float] = None,
    max_marks_filter: Optional[float] = None,
    grade: Optional[str] = None,
    sort_by: str = "relevance",
    page: int = 1,
    page_size: int = 20,
) -> dict:
    """Run an analytics query against the RAG service.

    Returns:
        Response dict with results, summary, and pagination.
    """
    payload: dict = {
        "query": query,
        "sort_by": sort_by,
        "page": page,
        "page_size": page_size,
    }
    if student_id:
        payload["student_id"] = student_id
    if student_name:
        payload["student_name"] = student_name
    if class_name:
        payload["class_name"] = class_name
    if subject:
        payload["subject"] = subject
    if exam_id is not None:
        payload["exam_id"] = exam_id
    if exam_type:
        payload["exam_type"] = exam_type
    if academic_year:
        payload["academic_year"] = academic_year
    if min_marks is not None:
        payload["min_marks"] = min_marks
    if max_marks_filter is not None:
        payload["max_marks_filter"] = max_marks_filter
    if grade:
        payload["grade"] = grade

    rag_url = f"{settings.RAG_SERVICE_URL}/api/v1/analytics/query"
    logger.info(f"Sending analytics query to RAG service: {payload}")

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(rag_url, json=payload)
        response.raise_for_status()
        return response.json()


async def get_analytics_filters() -> dict:
    """Fetch available analytics filter values from the RAG service.

    Returns:
        Dict with classes, subjects, exam_types, academic_years.
    """
    rag_url = f"{settings.RAG_SERVICE_URL}/api/v1/analytics/filters"

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(rag_url)
        response.raise_for_status()
        return response.json()
