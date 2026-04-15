"""Exam event management endpoints."""

from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.auth import get_current_user
from app.db.session import get_db
from app.schemas.exam import (
    ExamCreate,
    ExamUpdate,
    ExamResponse,
    ExamListResponse,
    ExamClassPaperCreate,
    ExamClassPaperUpdate,
)
from app.services.exam_service import (
    create_exam,
    get_exams,
    get_exam,
    update_exam,
    delete_exam,
    add_class_paper,
    update_class_paper,
    delete_class_paper,
    select_papers,
)

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


# ── Exam CRUD ──────────────────────────────────────────────────


@router.get("", response_model=List[ExamListResponse])
async def list_exams(
    academic_year: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user),
):
    """List all exam events with optional filters."""
    _require_staff(current_user)
    return await get_exams(db, academic_year=academic_year, status=status_filter, skip=skip, limit=limit)


@router.post("", response_model=ExamResponse, status_code=status.HTTP_201_CREATED)
async def create_exam_endpoint(
    data: ExamCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user),
):
    """Create a new exam event."""
    _require_staff(current_user)
    return await create_exam(db, data, created_by=current_user.get("sub") if current_user else None)


@router.get("/{exam_id}", response_model=ExamResponse)
async def get_exam_endpoint(
    exam_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user),
):
    """Get an exam event by ID (includes class paper entries)."""
    _require_staff(current_user)
    exam = await get_exam(db, exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return exam


@router.patch("/{exam_id}", response_model=ExamResponse)
async def update_exam_endpoint(
    exam_id: int,
    data: ExamUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user),
):
    """Update exam event details (only before paper selection)."""
    _require_staff(current_user)
    try:
        result = await update_exam(db, exam_id, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not result:
        raise HTTPException(status_code=404, detail="Exam not found")
    return result


@router.delete("/{exam_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_exam_endpoint(
    exam_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user),
):
    """Delete a draft exam."""
    _require_staff(current_user)
    try:
        deleted = await delete_exam(db, exam_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not deleted:
        raise HTTPException(status_code=404, detail="Exam not found")


# ── Class paper entries ────────────────────────────────────────


@router.post("/{exam_id}/classes", response_model=ExamResponse, status_code=status.HTTP_201_CREATED)
async def add_class_paper_endpoint(
    exam_id: int,
    data: ExamClassPaperCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user),
):
    """Add a class+subject entry to an exam."""
    _require_staff(current_user)
    try:
        return await add_class_paper(db, exam_id, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{exam_id}/classes/{class_paper_id}", response_model=ExamResponse)
async def update_class_paper_endpoint(
    exam_id: int,
    class_paper_id: int,
    data: ExamClassPaperUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user),
):
    """Update a class paper entry (attach/change paper sets)."""
    _require_staff(current_user)
    try:
        return await update_class_paper(db, exam_id, class_paper_id, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{exam_id}/classes/{class_paper_id}", response_model=ExamResponse)
async def delete_class_paper_endpoint(
    exam_id: int,
    class_paper_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user),
):
    """Remove a class paper entry from an exam."""
    _require_staff(current_user)
    try:
        return await delete_class_paper(db, exam_id, class_paper_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── Random paper selection ─────────────────────────────────────


@router.post("/{exam_id}/select-papers", response_model=ExamResponse)
async def select_papers_endpoint(
    exam_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user),
):
    """
    Randomly pick one paper set (A/B/C) for every class entry in the exam.
    Only available once all entries have 3 sets and today >= paper_selection_date.
    This action is irreversible.
    """
    _require_staff(current_user)
    try:
        return await select_papers(
            db, exam_id,
            selected_by=current_user.get("sub") if current_user else None,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
