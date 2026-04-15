"""Admission request endpoints."""

from typing import List, Optional
from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.auth import get_current_user, oauth2_scheme
from app.db.session import get_db
from app.schemas.admission import (
    AdmissionRequest,
    AdmissionRequestCreate,
    AdmissionRequestResponse,
    AdmissionRequestUpdate,
    AdmissionStatus,
    ClassAdmitRequest
)
from app.services.admission_service import (
    create_admission_request,
    get_admission_request_by_id,
    get_admission_requests,
    update_admission_request,
    admit_to_class
)

router = APIRouter()


@router.post("/request", response_model=AdmissionRequestResponse, status_code=status.HTTP_201_CREATED)
async def submit_admission_request(
    request: AdmissionRequestCreate,
    db: AsyncSession = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme)
):
    """
    Submit a new student admission request.
    
    This endpoint is accessible to:
    - Guest users (no login required)
    - Authenticated users
    
    Required information:
    - Student name, date of birth, gender
    - Parent/Guardian information
    - Contact details
    - Previous school information (optional)
    - Grade applying for
    """
    # Optional: Get user context if authenticated
    current_user = None
    if token:
        from app.core.security import decode_token
        current_user = decode_token(token)
    
    # Add metadata to the request
    submitted_by = None
    if current_user:
        submitted_by = current_user.get("sub", "guest")
    
    admission = await create_admission_request(db, request, submitted_by)
    
    return admission


@router.get("/request/{request_id}", response_model=AdmissionRequestResponse)
async def get_admission_request(
    request_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    Get admission request by ID.
    
    - Guest users can view their own submission using the request ID
    - Authenticated staff can view any admission request
    """
    admission = await get_admission_request_by_id(db, request_id)
    
    if not admission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admission request not found"
        )
    
    return admission


@router.get("/requests", response_model=List[AdmissionRequestResponse])
async def list_admission_requests(
    filter_status: Optional[AdmissionStatus] = Query(None, alias="status"),
    grade: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    List all admission requests (staff only).
    
    Filters:
    - filter_status: Filter by admission status
    - grade: Filter by grade applying for
    
    Pagination:
    - skip: Number of records to skip
    - limit: Maximum number of records to return
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_type = current_user.get("type")
    user_role = current_user.get("role")
    
    if user_type == "guest" or user_role not in ["admin", "staff"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only staff members can view all admission requests"
        )
    
    admissions = await get_admission_requests(
        db,
        status=filter_status,
        grade=grade,
        skip=skip,
        limit=limit
    )
    
    return admissions


@router.patch("/request/{request_id}", response_model=AdmissionRequestResponse)
async def update_admission_status(
    request_id: str,
    update: AdmissionRequestUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    Update admission request status (staff only).
    
    Actions:
    - Update status (pending, under_review, approved, rejected)
    - Add reviewer notes
    - Assign reviewer
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
            detail="Only staff members can update admission requests"
        )
    
    admission = await update_admission_request(
        db,
        request_id,
        update,
        reviewer=current_user.get("sub")
    )
    
    if not admission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admission request not found"
        )
    
    return admission


@router.get("/status/{request_id}")
async def check_admission_status(
    request_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Public endpoint to check admission request status.
    
    No authentication required - anyone with the request ID can check status.
    """
    admission = await get_admission_request_by_id(db, request_id)
    
    if not admission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admission request not found"
        )
    
    return {
        "request_id": admission.id,
        "student_name": admission.student_name,
        "status": admission.status,
        "submitted_at": admission.submitted_at,
        "last_updated": admission.updated_at
    }


@router.post("/admit/{request_id}", response_model=AdmissionRequestResponse)
async def admit_student_to_class(
    request_id: str,
    admit_request: ClassAdmitRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    Admit an approved student to a class (staff only).
    
    This endpoint:
    - Changes the status from 'approved' to 'admitted'
    - Assigns class, section, and optional roll number
    - Records admission timestamp and user who admitted
    
    Only approved applications can be admitted to class.
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
            detail="Only staff members can admit students"
        )
    
    try:
        admission = await admit_to_class(
            db,
            request_id,
            admit_request,
            admitted_by=current_user.get("sub")
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    if not admission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admission request not found"
        )
    
    return admission
