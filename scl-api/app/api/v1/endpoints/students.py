"""Student management endpoints (add / soft-delete / marks / class history)."""

from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.auth import get_current_user
from app.db.session import get_db
from app.schemas.admission import (
    AdmissionRequestResponse,
    DirectStudentCreate,
)
from app.schemas.student import (
    StudentMarkCreate,
    StudentMarkResponse,
    ClassHistoryCreate,
    ClassHistoryResponse,
)
from app.services.admission_service import (
    create_direct_student,
    soft_delete_student,
)
from app.services.student_service import (
    add_mark,
    get_marks,
    delete_mark,
    add_class_history,
    get_class_history,
    delete_class_history,
)

router = APIRouter()


@router.post("", response_model=AdmissionRequestResponse, status_code=status.HTTP_201_CREATED)
async def add_student(
    request: DirectStudentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user),
):
    """
    Directly add a student to a class (staff / admin only).

    This bypasses the full admission-request workflow and immediately
    creates an admitted student record.
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if current_user.get("role") not in ["admin", "staff"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only staff members can add students directly",
        )

    student = await create_direct_student(
        db,
        request,
        added_by=current_user.get("sub"),
    )
    return student


@router.delete("/{student_id}", response_model=AdmissionRequestResponse)
async def delete_student(
    student_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user),
):
    """
    Soft-delete a student (staff / admin only).

    The record is not removed from the database; instead `is_deleted` is set
    to True and a `deleted_at` timestamp is recorded.
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if current_user.get("role") not in ["admin", "staff"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only staff members can remove students",
        )

    student = await soft_delete_student(db, student_id)

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    return student


# ── Marks ──────────────────────────────────────────────────────


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


@router.get("/{student_id}/marks", response_model=List[StudentMarkResponse])
async def list_marks(
    student_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user),
):
    """Get all marks for a student."""
    _require_staff(current_user)
    return await get_marks(db, student_id)


@router.post("/{student_id}/marks", response_model=StudentMarkResponse, status_code=status.HTTP_201_CREATED)
async def create_mark(
    student_id: str,
    data: StudentMarkCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user),
):
    """Add a mark entry for a student."""
    _require_staff(current_user)
    return await add_mark(db, student_id, data)


@router.delete("/{student_id}/marks/{mark_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_mark(
    student_id: str,
    mark_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user),
):
    """Delete a mark entry."""
    _require_staff(current_user)
    deleted = await delete_mark(db, mark_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mark not found")


# ── Class History ──────────────────────────────────────────────


@router.get("/{student_id}/class-history", response_model=List[ClassHistoryResponse])
async def list_class_history(
    student_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user),
):
    """Get class history for a student."""
    _require_staff(current_user)
    return await get_class_history(db, student_id)


@router.post("/{student_id}/class-history", response_model=ClassHistoryResponse, status_code=status.HTTP_201_CREATED)
async def create_class_history(
    student_id: str,
    data: ClassHistoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user),
):
    """Add a class-history entry for a student."""
    _require_staff(current_user)
    return await add_class_history(db, student_id, data)


@router.delete("/{student_id}/class-history/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_class_history(
    student_id: str,
    entry_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user),
):
    """Delete a class-history entry."""
    _require_staff(current_user)
    deleted = await delete_class_history(db, entry_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class history entry not found")
