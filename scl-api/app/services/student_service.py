"""Service layer for student marks and class history."""

from typing import List, Optional
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import StudentMark as StudentMarkModel, ClassHistory as ClassHistoryModel
from app.schemas.student import (
    StudentMarkCreate,
    StudentMarkResponse,
    ClassHistoryCreate,
    ClassHistoryResponse,
)


# ── Marks ──────────────────────────────────────────────────────

async def add_mark(
    db: AsyncSession,
    student_id: str,
    data: StudentMarkCreate,
) -> StudentMarkResponse:
    mark = StudentMarkModel(
        student_id=student_id,
        exam_name=data.exam_name,
        subject=data.subject,
        marks_obtained=data.marks_obtained,
        max_marks=data.max_marks,
        grade=data.grade,
        academic_year=data.academic_year,
        remarks=data.remarks,
        created_at=datetime.utcnow(),
    )
    db.add(mark)
    await db.flush()
    await db.refresh(mark)
    return StudentMarkResponse.model_validate(mark)


async def get_marks(
    db: AsyncSession,
    student_id: str,
) -> List[StudentMarkResponse]:
    result = await db.execute(
        select(StudentMarkModel)
        .where(StudentMarkModel.student_id == student_id)
        .order_by(StudentMarkModel.academic_year.desc(), StudentMarkModel.exam_name, StudentMarkModel.subject)
    )
    rows = result.scalars().all()
    return [StudentMarkResponse.model_validate(r) for r in rows]


async def delete_mark(
    db: AsyncSession,
    mark_id: int,
) -> bool:
    result = await db.execute(
        select(StudentMarkModel).where(StudentMarkModel.id == mark_id)
    )
    mark = result.scalar_one_or_none()
    if not mark:
        return False
    await db.delete(mark)
    await db.flush()
    return True


# ── Class History ──────────────────────────────────────────────

async def add_class_history(
    db: AsyncSession,
    student_id: str,
    data: ClassHistoryCreate,
) -> ClassHistoryResponse:
    entry = ClassHistoryModel(
        student_id=student_id,
        academic_year=data.academic_year,
        class_name=data.class_name,
        section=data.section,
        roll_number=data.roll_number,
        start_date=data.start_date,
        end_date=data.end_date,
        remarks=data.remarks,
        created_at=datetime.utcnow(),
    )
    db.add(entry)
    await db.flush()
    await db.refresh(entry)
    return ClassHistoryResponse.model_validate(entry)


async def get_class_history(
    db: AsyncSession,
    student_id: str,
) -> List[ClassHistoryResponse]:
    result = await db.execute(
        select(ClassHistoryModel)
        .where(ClassHistoryModel.student_id == student_id)
        .order_by(ClassHistoryModel.academic_year.desc())
    )
    rows = result.scalars().all()
    return [ClassHistoryResponse.model_validate(r) for r in rows]


async def delete_class_history(
    db: AsyncSession,
    entry_id: int,
) -> bool:
    result = await db.execute(
        select(ClassHistoryModel).where(ClassHistoryModel.id == entry_id)
    )
    entry = result.scalar_one_or_none()
    if not entry:
        return False
    await db.delete(entry)
    await db.flush()
    return True
