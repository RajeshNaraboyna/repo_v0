"""Pydantic schemas for exam events."""

from typing import Optional, List
from datetime import date, datetime
from enum import Enum

from pydantic import BaseModel, Field, model_validator


class ExamStatus(str, Enum):
    DRAFT = "draft"
    PAPERS_ATTACHED = "papers_attached"
    PAPER_SELECTED = "paper_selected"
    CONDUCTED = "conducted"


# ── Exam Class Paper ───────────────────────────────────────────

class ExamClassPaperCreate(BaseModel):
    class_name: str = Field(..., min_length=1, max_length=50)
    subject: str = Field(..., min_length=1, max_length=100)
    paper_set_a_id: Optional[int] = None
    paper_set_b_id: Optional[int] = None
    paper_set_c_id: Optional[int] = None


class ExamClassPaperUpdate(BaseModel):
    class_name: Optional[str] = Field(default=None, min_length=1, max_length=50)
    subject: Optional[str] = Field(default=None, min_length=1, max_length=100)
    paper_set_a_id: Optional[int] = None
    paper_set_b_id: Optional[int] = None
    paper_set_c_id: Optional[int] = None


class PaperBrief(BaseModel):
    """Minimal info about an attached question paper."""
    id: int
    title: str
    status: str
    total_marks: float

    class Config:
        from_attributes = True


class ExamClassPaperResponse(BaseModel):
    id: int
    exam_id: int
    class_name: str
    subject: str
    paper_set_a_id: Optional[int] = None
    paper_set_b_id: Optional[int] = None
    paper_set_c_id: Optional[int] = None
    paper_set_a: Optional[PaperBrief] = None
    paper_set_b: Optional[PaperBrief] = None
    paper_set_c: Optional[PaperBrief] = None
    selected_set: Optional[str] = None
    selected_paper_id: Optional[int] = None
    selected_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Exam Event ─────────────────────────────────────────────────

class ExamCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    academic_year: str = Field(..., min_length=4, max_length=20)
    exam_type: str = Field(..., min_length=1, max_length=50)
    exam_date: date
    paper_selection_date: date

    @model_validator(mode="after")
    def selection_before_exam(self):
        if self.paper_selection_date > self.exam_date:
            raise ValueError("Paper selection date must be on or before the exam date")
        return self


class ExamUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    academic_year: Optional[str] = Field(default=None, min_length=4, max_length=20)
    exam_type: Optional[str] = Field(default=None, min_length=1, max_length=50)
    exam_date: Optional[date] = None
    paper_selection_date: Optional[date] = None
    status: Optional[str] = None

    @model_validator(mode="after")
    def selection_before_exam(self):
        if self.paper_selection_date and self.exam_date:
            if self.paper_selection_date > self.exam_date:
                raise ValueError("Paper selection date must be on or before the exam date")
        return self


class ExamResponse(BaseModel):
    id: int
    name: str
    academic_year: str
    exam_type: str
    exam_date: date
    paper_selection_date: date
    status: str
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    class_papers: List[ExamClassPaperResponse] = []

    class Config:
        from_attributes = True


class ExamListResponse(BaseModel):
    """Lighter response for the list endpoint (no nested paper details)."""
    id: int
    name: str
    academic_year: str
    exam_type: str
    exam_date: date
    paper_selection_date: date
    status: str
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    class_count: int = 0

    class Config:
        from_attributes = True
