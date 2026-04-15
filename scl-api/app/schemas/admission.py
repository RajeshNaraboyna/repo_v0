"""Admission request schemas."""

from typing import Optional, List
from datetime import datetime, date
from enum import Enum

from pydantic import BaseModel, EmailStr, Field


class Gender(str, Enum):
    """Gender enumeration."""
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"


class AdmissionStatus(str, Enum):
    """Admission request status enumeration."""
    PENDING = "pending"
    UNDER_REVIEW = "under_review"
    DOCUMENTS_REQUIRED = "documents_required"
    APPROVED = "approved"
    REJECTED = "rejected"
    WAITLISTED = "waitlisted"
    ADMITTED = "admitted"


class ParentGuardianInfo(BaseModel):
    """Parent/Guardian information schema."""
    name: str = Field(..., min_length=2, max_length=100)
    relationship: str = Field(..., description="Relationship to student (e.g., Father, Mother, Guardian)")
    phone: str = Field(..., min_length=10, max_length=15)
    email: Optional[EmailStr] = None
    occupation: Optional[str] = None
    address: Optional[str] = None


class PreviousSchoolInfo(BaseModel):
    """Previous school information schema."""
    school_name: str = Field(..., min_length=2, max_length=200)
    grade_completed: str
    year_completed: int
    reason_for_leaving: Optional[str] = None
    transfer_certificate: Optional[bool] = False


class AdmissionRequestCreate(BaseModel):
    """Admission request creation schema."""
    # Student Information
    student_name: str = Field(..., min_length=2, max_length=100)
    date_of_birth: date
    gender: Gender
    nationality: str = Field(default="Indian", max_length=50)
    religion: Optional[str] = Field(default=None, max_length=50)
    mother_tongue: Optional[str] = Field(default=None, max_length=50)
    
    # Academic Information
    grade_applying_for: str = Field(..., description="Grade/Class applying for")
    academic_year: str = Field(..., description="Academic year (e.g., 2026-2027)")
    
    # Contact Information
    contact_phone: str = Field(..., min_length=10, max_length=15)
    contact_email: EmailStr
    residential_address: str = Field(..., min_length=10, max_length=500)
    city: str = Field(..., max_length=100)
    state: str = Field(..., max_length=100)
    pincode: str = Field(..., min_length=5, max_length=10)
    
    # Parent/Guardian Information
    primary_guardian: ParentGuardianInfo
    secondary_guardian: Optional[ParentGuardianInfo] = None
    
    # Previous School (optional)
    previous_school: Optional[PreviousSchoolInfo] = None
    
    # Additional Information
    medical_conditions: Optional[str] = Field(default=None, max_length=500)
    allergies: Optional[str] = Field(default=None, max_length=500)
    special_needs: Optional[str] = Field(default=None, max_length=500)
    how_did_you_hear: Optional[str] = Field(default=None, max_length=200)
    additional_notes: Optional[str] = Field(default=None, max_length=1000)
    
    # Consent
    terms_accepted: bool = Field(..., description="Acceptance of terms and conditions")
    data_privacy_accepted: bool = Field(..., description="Acceptance of data privacy policy")


class AdmissionRequest(AdmissionRequestCreate):
    """Admission request database model schema."""
    id: str
    status: AdmissionStatus = AdmissionStatus.PENDING
    submitted_at: datetime
    updated_at: datetime
    submitted_by: Optional[str] = None
    reviewer: Optional[str] = None
    reviewer_notes: Optional[str] = None
    
    class Config:
        from_attributes = True


class AdmissionRequestResponse(BaseModel):
    """Admission request response schema."""
    id: str
    student_name: str
    date_of_birth: date
    gender: Gender
    grade_applying_for: str
    academic_year: str
    contact_email: EmailStr
    contact_phone: str
    city: str
    state: str
    status: AdmissionStatus
    submitted_at: datetime
    updated_at: datetime
    primary_guardian: ParentGuardianInfo
    secondary_guardian: Optional[ParentGuardianInfo] = None
    previous_school: Optional[PreviousSchoolInfo] = None
    reviewer: Optional[str] = None
    reviewer_notes: Optional[str] = None
    # Class admission fields
    admitted_class: Optional[str] = None
    admitted_section: Optional[str] = None
    roll_number: Optional[str] = None
    admitted_at: Optional[datetime] = None
    admitted_by: Optional[str] = None
    
    class Config:
        from_attributes = True


class AdmissionRequestUpdate(BaseModel):
    """Admission request update schema (for staff)."""
    status: Optional[AdmissionStatus] = None
    reviewer_notes: Optional[str] = Field(default=None, max_length=1000)


class ClassAdmitRequest(BaseModel):
    """Class admission request schema."""
    admitted_class: str = Field(..., min_length=1, max_length=50, description="Class/Grade to admit the student to")
    admitted_section: str = Field(..., min_length=1, max_length=10, description="Section (e.g., A, B, C)")
    roll_number: Optional[str] = Field(default=None, max_length=20, description="Roll number in the class")


class DirectStudentCreate(BaseModel):
    """Schema for directly adding a student (without going through admission process)."""
    # Student Information
    student_name: str = Field(..., min_length=2, max_length=100)
    date_of_birth: date
    gender: Gender
    nationality: str = Field(default="Indian", max_length=50)
    religion: Optional[str] = Field(default=None, max_length=50)
    mother_tongue: Optional[str] = Field(default=None, max_length=50)

    # Academic / Class Information
    grade_applying_for: str = Field(..., description="Grade/Class")
    academic_year: str = Field(..., description="Academic year (e.g., 2026-2027)")
    admitted_class: str = Field(..., min_length=1, max_length=50)
    admitted_section: str = Field(..., min_length=1, max_length=10)
    roll_number: Optional[str] = Field(default=None, max_length=20)

    # Contact Information
    contact_phone: str = Field(..., min_length=10, max_length=15)
    contact_email: EmailStr
    residential_address: str = Field(..., min_length=10, max_length=500)
    city: str = Field(..., max_length=100)
    state: str = Field(..., max_length=100)
    pincode: str = Field(..., min_length=5, max_length=10)

    # Parent/Guardian Information
    primary_guardian: ParentGuardianInfo
    secondary_guardian: Optional[ParentGuardianInfo] = None

    # Previous School (optional)
    previous_school: Optional[PreviousSchoolInfo] = None

    # Additional Information
    medical_conditions: Optional[str] = Field(default=None, max_length=500)
    allergies: Optional[str] = Field(default=None, max_length=500)
    special_needs: Optional[str] = Field(default=None, max_length=500)
    additional_notes: Optional[str] = Field(default=None, max_length=1000)
