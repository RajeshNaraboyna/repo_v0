"""Question paper management endpoints."""

from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.auth import get_current_user
from app.db.session import get_db
from app.schemas.question_paper import (
    QuestionPaperCreate,
    QuestionPaperUpdate,
    QuestionPaperResponse,
    QuestionCreate,
    QuestionUpdate,
    QuestionResponse,
)
from app.services.question_paper_service import (
    create_question_paper,
    get_question_papers,
    get_question_paper,
    update_question_paper,
    delete_question_paper,
    add_question,
    update_question,
    delete_question,
)
from app.services.pdf_service import generate_question_paper_pdf

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


# ── Question Papers CRUD ──────────────────────────────────────


@router.get("", response_model=List[QuestionPaperResponse])
async def list_question_papers(
    status_filter: Optional[str] = Query(None, alias="status"),
    subject: Optional[str] = None,
    class_name: Optional[str] = None,
    academic_year: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user),
):
    """List all question papers with optional filters."""
    _require_staff(current_user)
    return await get_question_papers(
        db,
        status=status_filter,
        subject=subject,
        class_name=class_name,
        academic_year=academic_year,
        skip=skip,
        limit=limit,
    )


@router.post("", response_model=QuestionPaperResponse, status_code=status.HTTP_201_CREATED)
async def create_paper(
    data: QuestionPaperCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user),
):
    """Create a new question paper (optionally with questions)."""
    _require_staff(current_user)
    return await create_question_paper(
        db, data, created_by=current_user.get("sub") if current_user else None
    )


@router.get("/{paper_id}", response_model=QuestionPaperResponse)
async def get_paper(
    paper_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user),
):
    """Get a question paper by ID (includes questions)."""
    _require_staff(current_user)
    paper = await get_question_paper(db, paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Question paper not found")
    return paper


@router.patch("/{paper_id}", response_model=QuestionPaperResponse)
async def update_paper(
    paper_id: int,
    data: QuestionPaperUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user),
):
    """
    Update a question paper.

    Status transitions:
    - draft  -> review / approved
    - review -> approved / draft
    - approved -> published / draft
    - published -> (no changes allowed, except admin can revert to draft)

    Only metadata is editable while the paper is in *draft* or *review*.
    """
    _require_staff(current_user)

    existing = await get_question_paper(db, paper_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Question paper not found")

    # Block edits on published papers (unless admin reverting status)
    role = current_user.get("role") if current_user else None
    if existing.status == "published":
        if not (data.status and role == "admin"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Published papers cannot be edited. An admin can revert to draft first.",
            )

    # If approving, record approver
    if data.status and data.status.value == "approved":
        result = await update_question_paper(db, paper_id, data)
        if result:
            # Set approved_by via direct update
            from sqlalchemy import update as sa_update
            from app.db.models import QuestionPaper as QPModel
            await db.execute(
                sa_update(QPModel)
                .where(QPModel.id == paper_id)
                .values(approved_by=current_user.get("sub") if current_user else None)
            )
            await db.flush()
            return await get_question_paper(db, paper_id)
        raise HTTPException(status_code=404, detail="Question paper not found")

    result = await update_question_paper(db, paper_id, data)
    if not result:
        raise HTTPException(status_code=404, detail="Question paper not found")
    return result


@router.delete("/{paper_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_paper(
    paper_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user),
):
    """Delete a question paper (only draft papers can be deleted)."""
    _require_staff(current_user)

    existing = await get_question_paper(db, paper_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Question paper not found")

    if existing.status != "draft":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only draft papers can be deleted",
        )

    await delete_question_paper(db, paper_id)


# ── PDF Generation ────────────────────────────────────────────


@router.get("/{paper_id}/pdf")
async def download_paper_pdf(
    paper_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user),
):
    """Generate and download a question paper as PDF."""
    _require_staff(current_user)

    paper = await get_question_paper(db, paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Question paper not found")

    # Convert Pydantic model to dict for the PDF service
    paper_dict = paper.model_dump()

    pdf_bytes = generate_question_paper_pdf(paper_dict)

    # Build a filename from the paper metadata
    safe_title = paper.title.replace(" ", "_").replace("/", "-")[:60]
    filename = f"{safe_title}_{paper.class_name}_{paper.exam_type}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
        },
    )


# ── Questions within a paper ──────────────────────────────────


@router.post("/{paper_id}/questions", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
async def create_question(
    paper_id: int,
    data: QuestionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user),
):
    """Add a question to a paper."""
    _require_staff(current_user)

    existing = await get_question_paper(db, paper_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Question paper not found")
    if existing.status not in ("draft", "review"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Questions can only be added to draft or review papers",
        )

    question = await add_question(db, paper_id, data)
    if not question:
        raise HTTPException(status_code=404, detail="Question paper not found")
    return question


@router.patch("/{paper_id}/questions/{question_id}", response_model=QuestionResponse)
async def edit_question(
    paper_id: int,
    question_id: int,
    data: QuestionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user),
):
    """Update a question."""
    _require_staff(current_user)

    existing = await get_question_paper(db, paper_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Question paper not found")
    if existing.status not in ("draft", "review"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Questions can only be edited in draft or review papers",
        )

    question = await update_question(db, question_id, data)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    return question


@router.delete("/{paper_id}/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_question(
    paper_id: int,
    question_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user),
):
    """Remove a question from a paper."""
    _require_staff(current_user)

    existing = await get_question_paper(db, paper_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Question paper not found")
    if existing.status not in ("draft", "review"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Questions can only be removed from draft or review papers",
        )

    deleted = await delete_question(db, question_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Question not found")
