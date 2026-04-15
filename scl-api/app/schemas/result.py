"""Pydantic schemas for student results."""

from typing import Optional, List
from datetime import datetime

from pydantic import BaseModel, Field


# ── Request Schemas ────────────────────────────────────────────

class StudentResultCreate(BaseModel):
    """Create / update a single subject result for a student."""
    exam_id: int
    student_id: str = Field(..., min_length=1, max_length=8)
    class_name: str = Field(..., min_length=1, max_length=50)
    subject: str = Field(..., min_length=1, max_length=100)
    marks_obtained: Optional[float] = None
    max_marks: float = 100
    grade: Optional[str] = Field(default=None, max_length=5)
    remarks: Optional[str] = None


class StudentResultUpdate(BaseModel):
    marks_obtained: Optional[float] = None
    max_marks: Optional[float] = None
    grade: Optional[str] = Field(default=None, max_length=5)
    remarks: Optional[str] = None


# ── Response Schemas ───────────────────────────────────────────

class StudentResultResponse(BaseModel):
    id: int
    exam_id: int
    student_id: str
    class_name: str
    subject: str
    marks_obtained: Optional[float] = None
    max_marks: float
    grade: Optional[str] = None
    remarks: Optional[str] = None
    pdf_filename: Optional[str] = None
    has_pdf: bool = False
    uploaded_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class StudentResultListResponse(BaseModel):
    """Lighter response used in list endpoints."""
    id: int
    exam_id: int
    student_id: str
    class_name: str
    subject: str
    marks_obtained: Optional[float] = None
    max_marks: float
    grade: Optional[str] = None
    pdf_filename: Optional[str] = None
    has_pdf: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


# ── Aggregation helpers ────────────────────────────────────────

class ResultExamSummary(BaseModel):
    """One exam in the results listing."""
    exam_id: int
    exam_name: str
    academic_year: str
    exam_type: str
    exam_date: str  # ISO date
    status: str
    class_count: int = 0
    result_count: int = 0


class ResultClassSummary(BaseModel):
    """One class within an exam."""
    class_name: str
    subjects: List[str] = []
    student_count: int = 0
    result_count: int = 0


class ResultStudentSummary(BaseModel):
    """One student within a class."""
    student_id: str
    student_name: str
    roll_number: Optional[str] = None
    subjects_completed: int = 0
    total_subjects: int = 0
    total_marks: Optional[float] = None
    total_max_marks: Optional[float] = None
    has_pdf: bool = False
