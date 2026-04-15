"""Pydantic schemas for question papers."""

from typing import Optional, List
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class QuestionPaperStatus(str, Enum):
    DRAFT = "draft"
    REVIEW = "review"
    APPROVED = "approved"
    PUBLISHED = "published"


class ExamType(str, Enum):
    UNIT_TEST = "unit_test"
    QUARTERLY = "quarterly"
    HALF_YEARLY = "half_yearly"
    MIDTERM = "midterm"
    FINAL = "final"


class QuestionType(str, Enum):
    MCQ = "mcq"
    SHORT_ANSWER = "short_answer"
    LONG_ANSWER = "long_answer"
    DESCRIPTIVE = "descriptive"
    FILL_IN_BLANK = "fill_in_blank"


# ── Question ───────────────────────────────────────────────────

class QuestionCreate(BaseModel):
    question_number: int = Field(..., ge=1)
    question_text: str = Field(..., min_length=1)
    question_type: QuestionType = QuestionType.DESCRIPTIVE
    marks: float = Field(..., ge=0)
    options: Optional[dict] = None
    expected_answer: Optional[str] = None
    section: Optional[str] = Field(default=None, max_length=20)


class QuestionUpdate(BaseModel):
    question_number: Optional[int] = Field(default=None, ge=1)
    question_text: Optional[str] = Field(default=None, min_length=1)
    question_type: Optional[QuestionType] = None
    marks: Optional[float] = Field(default=None, ge=0)
    options: Optional[dict] = None
    expected_answer: Optional[str] = None
    section: Optional[str] = Field(default=None, max_length=20)


class QuestionResponse(BaseModel):
    id: int
    question_paper_id: int
    question_number: int
    question_text: str
    question_type: str
    marks: float
    options: Optional[dict] = None
    expected_answer: Optional[str] = None
    section: Optional[str] = None

    class Config:
        from_attributes = True


# ── Question Paper ─────────────────────────────────────────────

class ContentBlock(BaseModel):
    """A single block in the visual question paper designer."""
    id: str
    type: str  # header, instructions, section_title, question, text, image, divider
    content: str = ""  # HTML content from the rich-text editor
    position: int = 0
    metadata: Optional[dict] = None  # question_number, marks, question_type, section, etc.


class QuestionPaperCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    subject: str = Field(..., min_length=1, max_length=100)
    class_name: str = Field(..., min_length=1, max_length=50)
    academic_year: str = Field(..., min_length=4, max_length=20)
    exam_type: ExamType
    total_marks: float = Field(default=100, ge=1)
    duration_minutes: int = Field(default=180, ge=1)
    instructions: Optional[str] = None
    content_blocks: Optional[List[dict]] = None
    questions: Optional[List[QuestionCreate]] = None


class QuestionPaperUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    subject: Optional[str] = Field(default=None, min_length=1, max_length=100)
    class_name: Optional[str] = Field(default=None, min_length=1, max_length=50)
    academic_year: Optional[str] = Field(default=None, min_length=4, max_length=20)
    exam_type: Optional[ExamType] = None
    total_marks: Optional[float] = Field(default=None, ge=1)
    duration_minutes: Optional[int] = Field(default=None, ge=1)
    instructions: Optional[str] = None
    content_blocks: Optional[List[dict]] = None
    status: Optional[QuestionPaperStatus] = None


class QuestionPaperResponse(BaseModel):
    id: int
    title: str
    subject: str
    class_name: str
    academic_year: str
    exam_type: str
    total_marks: float
    duration_minutes: int
    instructions: Optional[str] = None
    content_blocks: Optional[List[dict]] = None
    status: str
    created_by: Optional[str] = None
    approved_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    questions: List[QuestionResponse] = []

    class Config:
        from_attributes = True
