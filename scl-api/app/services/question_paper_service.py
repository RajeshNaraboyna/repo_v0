"""Service layer for question paper management."""

from typing import List, Optional
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import QuestionPaper, QuestionPaperQuestion
from app.schemas.question_paper import (
    QuestionPaperCreate,
    QuestionPaperUpdate,
    QuestionPaperResponse,
    QuestionCreate,
    QuestionUpdate,
    QuestionResponse,
)


async def create_question_paper(
    db: AsyncSession,
    data: QuestionPaperCreate,
    created_by: Optional[str] = None,
) -> QuestionPaperResponse:
    paper = QuestionPaper(
        title=data.title,
        subject=data.subject,
        class_name=data.class_name,
        academic_year=data.academic_year,
        exam_type=data.exam_type.value,
        total_marks=data.total_marks,
        duration_minutes=data.duration_minutes,
        instructions=data.instructions,
        content_blocks=data.content_blocks,
        status="draft",
        created_by=created_by,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(paper)
    await db.flush()
    await db.refresh(paper)

    # Add questions if provided
    if data.questions:
        for q in data.questions:
            question = QuestionPaperQuestion(
                question_paper_id=paper.id,
                question_number=q.question_number,
                question_text=q.question_text,
                question_type=q.question_type.value,
                marks=q.marks,
                options=q.options,
                expected_answer=q.expected_answer,
                section=q.section,
            )
            db.add(question)
        await db.flush()

    # Reload with questions
    result = await db.execute(
        select(QuestionPaper)
        .options(selectinload(QuestionPaper.questions))
        .where(QuestionPaper.id == paper.id)
    )
    paper = result.scalar_one()
    return QuestionPaperResponse.model_validate(paper)


async def get_question_papers(
    db: AsyncSession,
    status: Optional[str] = None,
    subject: Optional[str] = None,
    class_name: Optional[str] = None,
    academic_year: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
) -> List[QuestionPaperResponse]:
    stmt = select(QuestionPaper).options(selectinload(QuestionPaper.questions))

    if status:
        stmt = stmt.where(QuestionPaper.status == status)
    if subject:
        stmt = stmt.where(QuestionPaper.subject == subject)
    if class_name:
        stmt = stmt.where(QuestionPaper.class_name == class_name)
    if academic_year:
        stmt = stmt.where(QuestionPaper.academic_year == academic_year)

    stmt = stmt.order_by(QuestionPaper.updated_at.desc()).offset(skip).limit(limit)
    result = await db.execute(stmt)
    rows = result.scalars().all()
    return [QuestionPaperResponse.model_validate(r) for r in rows]


async def get_question_paper(
    db: AsyncSession,
    paper_id: int,
) -> Optional[QuestionPaperResponse]:
    result = await db.execute(
        select(QuestionPaper)
        .options(selectinload(QuestionPaper.questions))
        .where(QuestionPaper.id == paper_id)
    )
    paper = result.scalar_one_or_none()
    if not paper:
        return None
    return QuestionPaperResponse.model_validate(paper)


async def update_question_paper(
    db: AsyncSession,
    paper_id: int,
    data: QuestionPaperUpdate,
) -> Optional[QuestionPaperResponse]:
    result = await db.execute(
        select(QuestionPaper).where(QuestionPaper.id == paper_id)
    )
    paper = result.scalar_one_or_none()
    if not paper:
        return None

    update_data = data.model_dump(exclude_unset=True)
    # Convert enum values
    if "exam_type" in update_data and update_data["exam_type"] is not None:
        update_data["exam_type"] = update_data["exam_type"].value
    if "status" in update_data and update_data["status"] is not None:
        update_data["status"] = update_data["status"].value

    for field, value in update_data.items():
        setattr(paper, field, value)

    paper.updated_at = datetime.utcnow()
    await db.flush()

    # Reload with questions
    result = await db.execute(
        select(QuestionPaper)
        .options(selectinload(QuestionPaper.questions))
        .where(QuestionPaper.id == paper_id)
    )
    paper = result.scalar_one()
    return QuestionPaperResponse.model_validate(paper)


async def delete_question_paper(
    db: AsyncSession,
    paper_id: int,
) -> bool:
    result = await db.execute(
        select(QuestionPaper).where(QuestionPaper.id == paper_id)
    )
    paper = result.scalar_one_or_none()
    if not paper:
        return False
    await db.delete(paper)
    await db.flush()
    return True


# ── Questions within a paper ──────────────────────────────────

async def add_question(
    db: AsyncSession,
    paper_id: int,
    data: QuestionCreate,
) -> Optional[QuestionResponse]:
    # Verify paper exists
    result = await db.execute(
        select(QuestionPaper).where(QuestionPaper.id == paper_id)
    )
    paper = result.scalar_one_or_none()
    if not paper:
        return None

    question = QuestionPaperQuestion(
        question_paper_id=paper_id,
        question_number=data.question_number,
        question_text=data.question_text,
        question_type=data.question_type.value,
        marks=data.marks,
        options=data.options,
        expected_answer=data.expected_answer,
        section=data.section,
    )
    db.add(question)
    await db.flush()
    await db.refresh(question)
    return QuestionResponse.model_validate(question)


async def update_question(
    db: AsyncSession,
    question_id: int,
    data: QuestionUpdate,
) -> Optional[QuestionResponse]:
    result = await db.execute(
        select(QuestionPaperQuestion).where(QuestionPaperQuestion.id == question_id)
    )
    question = result.scalar_one_or_none()
    if not question:
        return None

    update_data = data.model_dump(exclude_unset=True)
    if "question_type" in update_data and update_data["question_type"] is not None:
        update_data["question_type"] = update_data["question_type"].value

    for field, value in update_data.items():
        setattr(question, field, value)

    await db.flush()
    await db.refresh(question)
    return QuestionResponse.model_validate(question)


async def delete_question(
    db: AsyncSession,
    question_id: int,
) -> bool:
    result = await db.execute(
        select(QuestionPaperQuestion).where(QuestionPaperQuestion.id == question_id)
    )
    question = result.scalar_one_or_none()
    if not question:
        return False
    await db.delete(question)
    await db.flush()
    return True
