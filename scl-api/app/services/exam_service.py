"""Service layer for exam event management."""

import random
from typing import List, Optional
from datetime import datetime, date

from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Exam, ExamClassPaper, QuestionPaper
from app.schemas.exam import (
    ExamCreate,
    ExamUpdate,
    ExamResponse,
    ExamListResponse,
    ExamClassPaperCreate,
    ExamClassPaperUpdate,
    ExamClassPaperResponse,
)


# ── helpers ────────────────────────────────────────────────────

def _load_options():
    return selectinload(Exam.class_papers).selectinload(ExamClassPaper.paper_set_a), \
           selectinload(Exam.class_papers).selectinload(ExamClassPaper.paper_set_b), \
           selectinload(Exam.class_papers).selectinload(ExamClassPaper.paper_set_c), \
           selectinload(Exam.class_papers).selectinload(ExamClassPaper.selected_paper)


async def _full_exam(db: AsyncSession, exam_id: int) -> Optional[Exam]:
    opts = _load_options()
    result = await db.execute(
        select(Exam).options(*opts).where(Exam.id == exam_id)
    )
    return result.scalar_one_or_none()


def _exam_to_response(exam: Exam) -> ExamResponse:
    return ExamResponse.model_validate(exam)


def _recompute_status(exam: Exam) -> str:
    """Derive status from class papers state (does not touch paper_selected/conducted)."""
    if exam.status in ("paper_selected", "conducted"):
        return exam.status
    if not exam.class_papers:
        return "draft"
    all_attached = all(
        cp.paper_set_a_id and cp.paper_set_b_id and cp.paper_set_c_id
        for cp in exam.class_papers
    )
    return "papers_attached" if all_attached else "draft"


# ── Exam CRUD ──────────────────────────────────────────────────

async def create_exam(
    db: AsyncSession,
    data: ExamCreate,
    created_by: Optional[str] = None,
) -> ExamResponse:
    exam = Exam(
        name=data.name,
        academic_year=data.academic_year,
        exam_type=data.exam_type,
        exam_date=data.exam_date,
        paper_selection_date=data.paper_selection_date,
        status="draft",
        created_by=created_by,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(exam)
    await db.flush()
    exam = await _full_exam(db, exam.id)
    return _exam_to_response(exam)


async def get_exams(
    db: AsyncSession,
    academic_year: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
) -> List[ExamListResponse]:
    stmt = (
        select(
            Exam,
            func.count(ExamClassPaper.id).label("class_count"),
        )
        .outerjoin(ExamClassPaper, ExamClassPaper.exam_id == Exam.id)
        .group_by(Exam.id)
    )
    if academic_year:
        stmt = stmt.where(Exam.academic_year == academic_year)
    if status:
        stmt = stmt.where(Exam.status == status)
    stmt = stmt.order_by(Exam.exam_date.desc()).offset(skip).limit(limit)
    result = await db.execute(stmt)
    rows = result.all()
    return [
        ExamListResponse(
            id=exam.id,
            name=exam.name,
            academic_year=exam.academic_year,
            exam_type=exam.exam_type,
            exam_date=exam.exam_date,
            paper_selection_date=exam.paper_selection_date,
            status=exam.status,
            created_by=exam.created_by,
            created_at=exam.created_at,
            updated_at=exam.updated_at,
            class_count=count,
        )
        for exam, count in rows
    ]


async def get_exam(db: AsyncSession, exam_id: int) -> Optional[ExamResponse]:
    exam = await _full_exam(db, exam_id)
    if not exam:
        return None
    return _exam_to_response(exam)


async def update_exam(
    db: AsyncSession,
    exam_id: int,
    data: ExamUpdate,
) -> Optional[ExamResponse]:
    result = await db.execute(select(Exam).where(Exam.id == exam_id))
    exam = result.scalar_one_or_none()
    if not exam:
        return None
    if exam.status in ("paper_selected", "conducted"):
        raise ValueError("Cannot edit an exam after paper selection")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(exam, field, value)
    exam.updated_at = datetime.utcnow()
    await db.flush()
    exam = await _full_exam(db, exam_id)
    return _exam_to_response(exam)


async def delete_exam(db: AsyncSession, exam_id: int) -> bool:
    result = await db.execute(select(Exam).where(Exam.id == exam_id))
    exam = result.scalar_one_or_none()
    if not exam:
        return False
    if exam.status != "draft":
        raise ValueError("Only draft exams can be deleted")
    await db.delete(exam)
    await db.flush()
    return True


# ── Class Paper entries ────────────────────────────────────────

async def add_class_paper(
    db: AsyncSession,
    exam_id: int,
    data: ExamClassPaperCreate,
) -> ExamResponse:
    result = await db.execute(select(Exam).where(Exam.id == exam_id))
    exam = result.scalar_one_or_none()
    if not exam:
        raise ValueError("Exam not found")
    if exam.status in ("paper_selected", "conducted"):
        raise ValueError("Cannot modify classes after paper selection")

    cp = ExamClassPaper(
        exam_id=exam_id,
        class_name=data.class_name,
        subject=data.subject,
        paper_set_a_id=data.paper_set_a_id,
        paper_set_b_id=data.paper_set_b_id,
        paper_set_c_id=data.paper_set_c_id,
    )
    db.add(cp)
    await db.flush()

    # recompute status
    exam = await _full_exam(db, exam_id)
    exam.status = _recompute_status(exam)
    exam.updated_at = datetime.utcnow()
    await db.flush()

    exam = await _full_exam(db, exam_id)
    return _exam_to_response(exam)


async def update_class_paper(
    db: AsyncSession,
    exam_id: int,
    class_paper_id: int,
    data: ExamClassPaperUpdate,
) -> ExamResponse:
    result = await db.execute(
        select(ExamClassPaper).where(
            ExamClassPaper.id == class_paper_id,
            ExamClassPaper.exam_id == exam_id,
        )
    )
    cp = result.scalar_one_or_none()
    if not cp:
        raise ValueError("Class paper entry not found")

    # check exam status
    exam_result = await db.execute(select(Exam).where(Exam.id == exam_id))
    exam = exam_result.scalar_one()
    if exam.status in ("paper_selected", "conducted"):
        raise ValueError("Cannot modify classes after paper selection")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(cp, field, value)
    await db.flush()

    # recompute status
    exam = await _full_exam(db, exam_id)
    exam.status = _recompute_status(exam)
    exam.updated_at = datetime.utcnow()
    await db.flush()

    exam = await _full_exam(db, exam_id)
    return _exam_to_response(exam)


async def delete_class_paper(
    db: AsyncSession,
    exam_id: int,
    class_paper_id: int,
) -> ExamResponse:
    result = await db.execute(
        select(ExamClassPaper).where(
            ExamClassPaper.id == class_paper_id,
            ExamClassPaper.exam_id == exam_id,
        )
    )
    cp = result.scalar_one_or_none()
    if not cp:
        raise ValueError("Class paper entry not found")

    exam_result = await db.execute(select(Exam).where(Exam.id == exam_id))
    exam = exam_result.scalar_one()
    if exam.status in ("paper_selected", "conducted"):
        raise ValueError("Cannot modify classes after paper selection")

    await db.delete(cp)
    await db.flush()

    exam = await _full_exam(db, exam_id)
    exam.status = _recompute_status(exam)
    exam.updated_at = datetime.utcnow()
    await db.flush()

    exam = await _full_exam(db, exam_id)
    return _exam_to_response(exam)


# ── Random paper selection ─────────────────────────────────────

async def select_papers(
    db: AsyncSession,
    exam_id: int,
    selected_by: Optional[str] = None,
) -> ExamResponse:
    exam = await _full_exam(db, exam_id)
    if not exam:
        raise ValueError("Exam not found")
    if exam.status == "paper_selected":
        raise ValueError("Papers have already been selected for this exam")
    if exam.status != "papers_attached":
        raise ValueError("All class entries must have 3 paper sets attached before selection")
    if date.today() < exam.paper_selection_date:
        raise ValueError(
            f"Paper selection can only happen on or after {exam.paper_selection_date}"
        )

    now = datetime.utcnow()
    for cp in exam.class_papers:
        sets = {
            "A": cp.paper_set_a_id,
            "B": cp.paper_set_b_id,
            "C": cp.paper_set_c_id,
        }
        chosen = random.choice(list(sets.keys()))
        cp.selected_set = chosen
        cp.selected_paper_id = sets[chosen]
        cp.selected_at = now

    exam.status = "paper_selected"
    exam.updated_at = now
    await db.flush()

    exam = await _full_exam(db, exam_id)
    return _exam_to_response(exam)
