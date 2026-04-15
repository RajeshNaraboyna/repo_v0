"""Admission service for handling admission requests."""

from typing import Optional, List
from datetime import datetime
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import AdmissionRequest as AdmissionRequestModel
from app.schemas.admission import (
    AdmissionRequestCreate,
    AdmissionRequestResponse,
    AdmissionRequestUpdate,
    AdmissionStatus,
    ParentGuardianInfo,
    PreviousSchoolInfo,
    ClassAdmitRequest,
    DirectStudentCreate
)


def _model_to_response(model: AdmissionRequestModel) -> AdmissionRequestResponse:
    """Convert database model to response schema."""
    return AdmissionRequestResponse(
        id=model.id,
        student_name=model.student_name,
        date_of_birth=model.date_of_birth,
        gender=model.gender,
        grade_applying_for=model.grade_applying_for,
        academic_year=model.academic_year,
        contact_email=model.contact_email,
        contact_phone=model.contact_phone,
        city=model.city,
        state=model.state,
        status=AdmissionStatus(model.status),
        submitted_at=model.submitted_at,
        updated_at=model.updated_at,
        primary_guardian=ParentGuardianInfo(**model.primary_guardian),
        secondary_guardian=ParentGuardianInfo(**model.secondary_guardian) if model.secondary_guardian else None,
        previous_school=PreviousSchoolInfo(**model.previous_school) if model.previous_school else None,
        reviewer=model.reviewer,
        reviewer_notes=model.reviewer_notes,
        admitted_class=model.admitted_class,
        admitted_section=model.admitted_section,
        roll_number=model.roll_number,
        admitted_at=model.admitted_at,
        admitted_by=model.admitted_by
    )


async def create_admission_request(
    db: AsyncSession,
    request: AdmissionRequestCreate,
    submitted_by: Optional[str] = None
) -> AdmissionRequestResponse:
    """Create a new admission request."""
    request_id = str(uuid4())[:8].upper()  # Short, readable ID
    now = datetime.utcnow()
    
    admission = AdmissionRequestModel(
        id=request_id,
        student_name=request.student_name,
        date_of_birth=request.date_of_birth,
        gender=request.gender.value if hasattr(request.gender, 'value') else request.gender,
        nationality=request.nationality,
        religion=request.religion,
        mother_tongue=request.mother_tongue,
        grade_applying_for=request.grade_applying_for,
        academic_year=request.academic_year,
        contact_phone=request.contact_phone,
        contact_email=request.contact_email,
        residential_address=request.residential_address,
        city=request.city,
        state=request.state,
        pincode=request.pincode,
        primary_guardian=request.primary_guardian.model_dump(),
        secondary_guardian=request.secondary_guardian.model_dump() if request.secondary_guardian else None,
        previous_school=request.previous_school.model_dump() if request.previous_school else None,
        medical_conditions=request.medical_conditions,
        allergies=request.allergies,
        special_needs=request.special_needs,
        how_did_you_hear=request.how_did_you_hear,
        additional_notes=request.additional_notes,
        terms_accepted=request.terms_accepted,
        data_privacy_accepted=request.data_privacy_accepted,
        status=AdmissionStatus.PENDING.value,
        submitted_at=now,
        updated_at=now,
        submitted_by=submitted_by,
    )
    
    db.add(admission)
    await db.flush()
    await db.refresh(admission)
    
    return _model_to_response(admission)


async def get_admission_request_by_id(
    db: AsyncSession,
    request_id: str
) -> Optional[AdmissionRequestResponse]:
    """Get admission request by ID."""
    result = await db.execute(
        select(AdmissionRequestModel).where(
            AdmissionRequestModel.id == request_id,
            AdmissionRequestModel.is_deleted == False
        )
    )
    admission = result.scalar_one_or_none()
    
    if not admission:
        return None
    
    return _model_to_response(admission)


async def get_admission_requests(
    db: AsyncSession,
    status: Optional[AdmissionStatus] = None,
    grade: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
) -> List[AdmissionRequestResponse]:
    """Get all admission requests with optional filters."""
    query = select(AdmissionRequestModel).where(AdmissionRequestModel.is_deleted == False)
    
    # Apply filters
    if status:
        query = query.where(AdmissionRequestModel.status == status.value)
    if grade:
        query = query.where(AdmissionRequestModel.grade_applying_for == grade)
    
    # Sort by submitted_at descending and apply pagination
    query = query.order_by(AdmissionRequestModel.submitted_at.desc())
    query = query.offset(skip).limit(limit)
    
    result = await db.execute(query)
    admissions = result.scalars().all()
    
    return [_model_to_response(admission) for admission in admissions]


async def update_admission_request(
    db: AsyncSession,
    request_id: str,
    update: AdmissionRequestUpdate,
    reviewer: Optional[str] = None
) -> Optional[AdmissionRequestResponse]:
    """Update admission request status."""
    result = await db.execute(
        select(AdmissionRequestModel).where(AdmissionRequestModel.id == request_id)
    )
    admission = result.scalar_one_or_none()
    
    if not admission:
        return None
    
    if update.status:
        admission.status = update.status.value
    if update.reviewer_notes:
        admission.reviewer_notes = update.reviewer_notes
    if reviewer:
        admission.reviewer = reviewer
    
    admission.updated_at = datetime.utcnow()
    
    await db.flush()
    await db.refresh(admission)
    
    return _model_to_response(admission)


async def admit_to_class(
    db: AsyncSession,
    request_id: str,
    admit_request: ClassAdmitRequest,
    admitted_by: Optional[str] = None
) -> Optional[AdmissionRequestResponse]:
    """Admit an approved student to a class."""
    result = await db.execute(
        select(AdmissionRequestModel).where(AdmissionRequestModel.id == request_id)
    )
    admission = result.scalar_one_or_none()
    
    if not admission:
        return None
    
    # Only approved applications can be admitted
    if admission.status != AdmissionStatus.APPROVED.value:
        raise ValueError(f"Only approved applications can be admitted. Current status: {admission.status}")
    
    # Update admission details
    admission.status = AdmissionStatus.ADMITTED.value
    admission.admitted_class = admit_request.admitted_class
    admission.admitted_section = admit_request.admitted_section
    admission.roll_number = admit_request.roll_number
    admission.admitted_at = datetime.utcnow()
    admission.admitted_by = admitted_by
    admission.updated_at = datetime.utcnow()
    
    await db.flush()
    await db.refresh(admission)
    
    return _model_to_response(admission)


async def create_direct_student(
    db: AsyncSession,
    request: DirectStudentCreate,
    added_by: Optional[str] = None
) -> AdmissionRequestResponse:
    """Directly add a student without going through admission process."""
    student_id = str(uuid4())[:8].upper()
    now = datetime.utcnow()

    admission = AdmissionRequestModel(
        id=student_id,
        student_name=request.student_name,
        date_of_birth=request.date_of_birth,
        gender=request.gender.value if hasattr(request.gender, 'value') else request.gender,
        nationality=request.nationality,
        religion=request.religion,
        mother_tongue=request.mother_tongue,
        grade_applying_for=request.grade_applying_for,
        academic_year=request.academic_year,
        contact_phone=request.contact_phone,
        contact_email=request.contact_email,
        residential_address=request.residential_address,
        city=request.city,
        state=request.state,
        pincode=request.pincode,
        primary_guardian=request.primary_guardian.model_dump(),
        secondary_guardian=request.secondary_guardian.model_dump() if request.secondary_guardian else None,
        previous_school=request.previous_school.model_dump() if request.previous_school else None,
        medical_conditions=request.medical_conditions,
        allergies=request.allergies,
        special_needs=request.special_needs,
        additional_notes=request.additional_notes,
        terms_accepted=True,
        data_privacy_accepted=True,
        status=AdmissionStatus.ADMITTED.value,
        submitted_at=now,
        updated_at=now,
        submitted_by=added_by,
        admitted_class=request.admitted_class,
        admitted_section=request.admitted_section,
        roll_number=request.roll_number,
        admitted_at=now,
        admitted_by=added_by,
        is_deleted=False,
    )

    db.add(admission)
    await db.flush()
    await db.refresh(admission)

    return _model_to_response(admission)


async def soft_delete_student(
    db: AsyncSession,
    student_id: str
) -> Optional[AdmissionRequestResponse]:
    """Soft delete a student by setting is_deleted flag."""
    result = await db.execute(
        select(AdmissionRequestModel).where(
            AdmissionRequestModel.id == student_id,
            AdmissionRequestModel.is_deleted == False
        )
    )
    admission = result.scalar_one_or_none()

    if not admission:
        return None

    admission.is_deleted = True
    admission.deleted_at = datetime.utcnow()
    admission.updated_at = datetime.utcnow()

    await db.flush()
    await db.refresh(admission)

    return _model_to_response(admission)
