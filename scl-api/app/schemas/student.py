"""Schemas for student marks and class history."""

from typing import Optional, List
from datetime import datetime, date

from pydantic import BaseModel, Field


# ── Student Marks ──────────────────────────────────────────────

class StudentMarkCreate(BaseModel):
    """Create a mark entry for a student."""
    exam_name: str = Field(..., min_length=1, max_length=100)
    subject: str = Field(..., min_length=1, max_length=100)
    marks_obtained: float = Field(..., ge=0)
    max_marks: float = Field(default=100, ge=1)
    grade: Optional[str] = Field(default=None, max_length=5)
    academic_year: str = Field(..., min_length=4, max_length=20)
    remarks: Optional[str] = Field(default=None, max_length=500)


class StudentMarkResponse(BaseModel):
    id: int
    student_id: str
    exam_name: str
    subject: str
    marks_obtained: float
    max_marks: float
    grade: Optional[str] = None
    academic_year: str
    remarks: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── Class History ──────────────────────────────────────────────

class ClassHistoryCreate(BaseModel):
    """Create a class-history entry for a student."""
    academic_year: str = Field(..., min_length=4, max_length=20)
    class_name: str = Field(..., min_length=1, max_length=50)
    section: str = Field(..., min_length=1, max_length=10)
    roll_number: Optional[str] = Field(default=None, max_length=20)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    remarks: Optional[str] = Field(default=None, max_length=500)


class ClassHistoryResponse(BaseModel):
    id: int
    student_id: str
    academic_year: str
    class_name: str
    section: str
    roll_number: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    remarks: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
