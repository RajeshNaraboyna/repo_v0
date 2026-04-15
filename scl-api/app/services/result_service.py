"""Service layer for student results management."""

from typing import List, Optional
from datetime import datetime

from sqlalchemy import select, func, distinct, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import StudentResult, Exam, ExamClassPaper, AdmissionRequest
from app.schemas.result import (
    StudentResultCreate,
    StudentResultUpdate,
    StudentResultResponse,
    StudentResultListResponse,
    ResultExamSummary,
    ResultClassSummary,
    ResultStudentSummary,
)


# ── Helpers ────────────────────────────────────────────────────

def _normalize_class_name(name: str) -> str:
    """Normalize class name to the canonical 'Class X' format.

    Handles inputs like '10', 'class 10', 'Class 10', etc.
    """
    stripped = name.strip()
    if stripped.lower().startswith("class "):
        return "Class " + stripped[6:].strip()
    return "Class " + stripped


def _to_response(r: StudentResult) -> StudentResultResponse:
    resp = StudentResultResponse.model_validate(r)
    resp.has_pdf = r.pdf_data is not None and len(r.pdf_data) > 0
    return resp


def _to_list_response(r: StudentResult) -> StudentResultListResponse:
    resp = StudentResultListResponse.model_validate(r)
    resp.has_pdf = r.pdf_data is not None and len(r.pdf_data) > 0
    return resp


# ── Exam listing for results ──────────────────────────────────

async def get_result_exams(
    db: AsyncSession,
    academic_year: Optional[str] = None,
) -> List[ResultExamSummary]:
    """List exams that can have results, with counts."""
    stmt = (
        select(
            Exam,
            func.count(distinct(ExamClassPaper.class_name)).label("class_count"),
            func.count(StudentResult.id).label("result_count"),
        )
        .outerjoin(ExamClassPaper, ExamClassPaper.exam_id == Exam.id)
        .outerjoin(StudentResult, StudentResult.exam_id == Exam.id)
        .group_by(Exam.id)
        .order_by(Exam.exam_date.desc())
    )
    if academic_year:
        stmt = stmt.where(Exam.academic_year == academic_year)

    result = await db.execute(stmt)
    rows = result.all()
    return [
        ResultExamSummary(
            exam_id=exam.id,
            exam_name=exam.name,
            academic_year=exam.academic_year,
            exam_type=exam.exam_type,
            exam_date=str(exam.exam_date),
            status=exam.status,
            class_count=class_count,
            result_count=result_count,
        )
        for exam, class_count, result_count in rows
    ]


# ── Classes within an exam ────────────────────────────────────

async def get_result_classes(
    db: AsyncSession,
    exam_id: int,
) -> List[ResultClassSummary]:
    """List classes within an exam with per-class aggregation."""
    # Get distinct classes from exam_class_papers
    stmt = (
        select(ExamClassPaper.class_name, ExamClassPaper.subject)
        .where(ExamClassPaper.exam_id == exam_id)
        .order_by(ExamClassPaper.class_name, ExamClassPaper.subject)
    )
    result = await db.execute(stmt)
    rows = result.all()

    # Group by class
    class_map: dict[str, list[str]] = {}
    for class_name, subject in rows:
        class_map.setdefault(class_name, []).append(subject)

    summaries = []
    for class_name, subjects in class_map.items():
        # Normalise so e.g. '10' matches 'Class 10' in admitted students
        normalised = _normalize_class_name(class_name)
        # Count distinct students in this class who are admitted
        student_count_result = await db.execute(
            select(func.count(AdmissionRequest.id))
            .where(
                AdmissionRequest.admitted_class == normalised,
                AdmissionRequest.status == "admitted",
                AdmissionRequest.is_deleted == False,
            )
        )
        student_count = student_count_result.scalar() or 0

        # Count existing results for this exam+class
        result_count_result = await db.execute(
            select(func.count(StudentResult.id))
            .where(
                StudentResult.exam_id == exam_id,
                StudentResult.class_name == class_name,
            )
        )
        result_count = result_count_result.scalar() or 0

        summaries.append(
            ResultClassSummary(
                class_name=class_name,
                subjects=subjects,
                student_count=student_count,
                result_count=result_count,
            )
        )

    return summaries


# ── Students within an exam+class ─────────────────────────────

async def get_result_students(
    db: AsyncSession,
    exam_id: int,
    class_name: str,
) -> List[ResultStudentSummary]:
    """List students of a class with their result summary for an exam."""
    # Get subjects for this exam+class
    subj_result = await db.execute(
        select(ExamClassPaper.subject)
        .where(ExamClassPaper.exam_id == exam_id, ExamClassPaper.class_name == class_name)
    )
    subjects = [r[0] for r in subj_result.all()]
    total_subjects = len(subjects)

    # Normalise so e.g. '10' matches 'Class 10' in admitted students
    normalised = _normalize_class_name(class_name)

    # Get admitted students in this class
    students_result = await db.execute(
        select(AdmissionRequest)
        .where(
            AdmissionRequest.admitted_class == normalised,
            AdmissionRequest.status == "admitted",
            AdmissionRequest.is_deleted == False,
        )
        .order_by(AdmissionRequest.roll_number, AdmissionRequest.student_name)
    )
    students = students_result.scalars().all()

    summaries = []
    for s in students:
        # Get results for this student in this exam
        res = await db.execute(
            select(StudentResult)
            .where(
                StudentResult.exam_id == exam_id,
                StudentResult.student_id == s.id,
                StudentResult.class_name == class_name,
            )
        )
        results = res.scalars().all()

        completed = len(results)
        total_m = sum(r.marks_obtained for r in results if r.marks_obtained is not None)
        total_max = sum(r.max_marks for r in results)
        any_pdf = any(r.pdf_data is not None and len(r.pdf_data) > 0 for r in results)

        summaries.append(
            ResultStudentSummary(
                student_id=s.id,
                student_name=s.student_name,
                roll_number=s.roll_number,
                subjects_completed=completed,
                total_subjects=total_subjects,
                total_marks=total_m if completed > 0 else None,
                total_max_marks=total_max if completed > 0 else None,
                has_pdf=any_pdf,
            )
        )

    return summaries


# ── Results for a single student ──────────────────────────────

async def get_student_results(
    db: AsyncSession,
    exam_id: int,
    class_name: str,
    student_id: str,
) -> List[StudentResultResponse]:
    """Get all subject results for a student in a given exam+class."""
    result = await db.execute(
        select(StudentResult)
        .where(
            StudentResult.exam_id == exam_id,
            StudentResult.student_id == student_id,
            StudentResult.class_name == class_name,
        )
        .order_by(StudentResult.subject)
    )
    rows = result.scalars().all()
    return [_to_response(r) for r in rows]


# ── Create / Upsert result ───────────────────────────────────

async def upsert_result(
    db: AsyncSession,
    data: StudentResultCreate,
    uploaded_by: Optional[str] = None,
) -> StudentResultResponse:
    """Create or update a result row (marks / grade)."""
    # Check if exists
    result = await db.execute(
        select(StudentResult).where(
            StudentResult.exam_id == data.exam_id,
            StudentResult.student_id == data.student_id,
            StudentResult.subject == data.subject,
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        existing.marks_obtained = data.marks_obtained
        existing.max_marks = data.max_marks
        existing.grade = data.grade
        existing.remarks = data.remarks
        existing.class_name = data.class_name
        existing.updated_at = datetime.utcnow()
        await db.flush()
        await db.refresh(existing)
        return _to_response(existing)
    else:
        row = StudentResult(
            exam_id=data.exam_id,
            student_id=data.student_id,
            class_name=data.class_name,
            subject=data.subject,
            marks_obtained=data.marks_obtained,
            max_marks=data.max_marks,
            grade=data.grade,
            remarks=data.remarks,
            uploaded_by=uploaded_by,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(row)
        await db.flush()
        await db.refresh(row)
        return _to_response(row)


# ── Upload PDF ────────────────────────────────────────────────

async def upload_result_pdf(
    db: AsyncSession,
    result_id: int,
    pdf_data: bytes,
    filename: str,
    content_type: str,
    uploaded_by: Optional[str] = None,
) -> StudentResultResponse:
    """Attach / replace a PDF to an existing result row."""
    result = await db.execute(
        select(StudentResult).where(StudentResult.id == result_id)
    )
    row = result.scalar_one_or_none()
    if not row:
        raise ValueError("Result not found")

    row.pdf_data = pdf_data
    row.pdf_filename = filename
    row.pdf_content_type = content_type
    row.uploaded_by = uploaded_by
    row.updated_at = datetime.utcnow()
    await db.flush()
    await db.refresh(row)
    return _to_response(row)


async def upload_student_pdf(
    db: AsyncSession,
    exam_id: int,
    student_id: str,
    class_name: str,
    subject: str,
    pdf_data: bytes,
    filename: str,
    content_type: str,
    uploaded_by: Optional[str] = None,
) -> StudentResultResponse:
    """Upload a PDF for a student+subject, creating the result row if needed."""
    result = await db.execute(
        select(StudentResult).where(
            StudentResult.exam_id == exam_id,
            StudentResult.student_id == student_id,
            StudentResult.subject == subject,
        )
    )
    row = result.scalar_one_or_none()

    if row:
        row.pdf_data = pdf_data
        row.pdf_filename = filename
        row.pdf_content_type = content_type
        row.uploaded_by = uploaded_by
        row.class_name = class_name
        row.updated_at = datetime.utcnow()
        await db.flush()
        await db.refresh(row)
    else:
        row = StudentResult(
            exam_id=exam_id,
            student_id=student_id,
            class_name=class_name,
            subject=subject,
            max_marks=100,
            pdf_data=pdf_data,
            pdf_filename=filename,
            pdf_content_type=content_type,
            uploaded_by=uploaded_by,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(row)
        await db.flush()
        await db.refresh(row)

    return _to_response(row)


# ── Download PDF ──────────────────────────────────────────────

async def get_result_pdf(
    db: AsyncSession,
    result_id: int,
) -> Optional[tuple]:
    """Return (pdf_bytes, filename, content_type) or None."""
    result = await db.execute(
        select(StudentResult).where(StudentResult.id == result_id)
    )
    row = result.scalar_one_or_none()
    if not row or not row.pdf_data:
        return None
    return (row.pdf_data, row.pdf_filename or "result.pdf", row.pdf_content_type or "application/pdf")


# ── Delete result ─────────────────────────────────────────────

async def delete_result(
    db: AsyncSession,
    result_id: int,
) -> bool:
    result = await db.execute(
        select(StudentResult).where(StudentResult.id == result_id)
    )
    row = result.scalar_one_or_none()
    if not row:
        return False
    await db.delete(row)
    await db.flush()
    return True
