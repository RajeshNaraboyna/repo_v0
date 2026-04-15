"""Indexing service — converts student result data into documents and indexes them.

Modeled after sample-knowledge/app/services/upload.py but tailored for
structured student result data instead of file uploads.
"""

import logging
from typing import List

from app.schemas import (
    IndexStudentResultsRequest,
    IndexResponse,
    StudentResultDocument,
)
from app.services.vectordb import add_documents, delete_by_student

logger = logging.getLogger(__name__)


def _build_document_text(
    req: IndexStudentResultsRequest,
    result: StudentResultDocument,
) -> str:
    """Build a rich text document from a student result for embedding.

    The text is structured to enable semantic search across all fields.
    """
    marks_str = (
        f"{result.marks_obtained} out of {result.max_marks}"
        if result.marks_obtained is not None
        else "marks not entered"
    )
    grade_str = result.grade if result.grade else "not graded"
    remarks_str = result.remarks if result.remarks else "no remarks"
    pdf_str = "PDF attached" if result.has_pdf else "no PDF"
    roll_str = f", Roll Number {req.roll_number}" if req.roll_number else ""

    return (
        f"Student {req.student_name} (ID: {req.student_id}{roll_str}) "
        f"of {req.class_name} "
        f"appeared in {req.exam_name} ({req.exam_type}) "
        f"for academic year {req.academic_year}"
        f"{f', exam date {req.exam_date}' if req.exam_date else ''}. "
        f"Subject: {result.subject}. "
        f"Marks: {marks_str}. "
        f"Grade: {grade_str}. "
        f"Remarks: {remarks_str}. "
        f"{pdf_str}."
    )


def _build_document_id(
    student_id: str,
    exam_id: int,
    result_id: int,
) -> str:
    """Build a unique document ID for deduplication."""
    return f"student_{student_id}_exam_{exam_id}_result_{result_id}"


def _build_metadata(
    req: IndexStudentResultsRequest,
    result: StudentResultDocument,
) -> dict:
    """Build metadata dict for filtering in vector queries."""
    meta = {
        "student_id": req.student_id,
        "student_name": req.student_name,
        "class_name": req.class_name,
        "exam_id": req.exam_id,
        "exam_name": req.exam_name,
        "exam_type": req.exam_type,
        "academic_year": req.academic_year,
        "subject": result.subject,
        "max_marks": result.max_marks,
        "has_pdf": result.has_pdf,
        "result_id": result.result_id,
    }
    if req.roll_number:
        meta["roll_number"] = req.roll_number
    if req.exam_date:
        meta["exam_date"] = req.exam_date
    if result.marks_obtained is not None:
        meta["marks_obtained"] = result.marks_obtained
    if result.grade:
        meta["grade"] = result.grade
    if result.remarks:
        meta["remarks"] = result.remarks
    return meta


def index_student_results(req: IndexStudentResultsRequest) -> IndexResponse:
    """Index all results for a student into the vector store.

    Each subject result becomes a separate document so individual
    subjects can be retrieved independently via semantic search.
    Existing documents for the same student+exam are overwritten (upsert).
    """
    documents: List[str] = []
    metadatas: List[dict] = []
    ids: List[str] = []

    for result in req.results:
        doc_text = _build_document_text(req, result)
        doc_id = _build_document_id(req.student_id, req.exam_id, result.result_id)
        metadata = _build_metadata(req, result)

        documents.append(doc_text)
        metadatas.append(metadata)
        ids.append(doc_id)

    count = add_documents(documents, metadatas, ids)

    logger.info(
        f"Indexed {count} results for student {req.student_id} "
        f"in exam {req.exam_name}"
    )

    return IndexResponse(
        success=True,
        message=f"Successfully indexed {count} subject results for student {req.student_id}",
        documents_indexed=count,
        student_id=req.student_id,
        index_name=f"student_{req.student_id}",
    )


def remove_student_index(student_id: str) -> int:
    """Remove all indexed documents for a student."""
    return delete_by_student(student_id)
