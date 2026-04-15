"""Database models."""

from datetime import datetime, date
from typing import Optional

from sqlalchemy import String, Text, Boolean, Date, DateTime, Enum as SQLEnum, JSON, Integer, Float, ForeignKey, LargeBinary, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.schemas.admission import AdmissionStatus, Gender


class AdmissionRequest(Base):
    """Admission request database model."""
    
    __tablename__ = "admission_requests"
    
    # Primary key
    id: Mapped[str] = mapped_column(String(8), primary_key=True)
    
    # Student Information
    student_name: Mapped[str] = mapped_column(String(100), nullable=False)
    date_of_birth: Mapped[date] = mapped_column(Date, nullable=False)
    gender: Mapped[str] = mapped_column(String(10), nullable=False)
    nationality: Mapped[str] = mapped_column(String(50), default="Indian")
    religion: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    mother_tongue: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Academic Information
    grade_applying_for: Mapped[str] = mapped_column(String(50), nullable=False)
    academic_year: Mapped[str] = mapped_column(String(20), nullable=False)
    
    # Contact Information
    contact_phone: Mapped[str] = mapped_column(String(15), nullable=False)
    contact_email: Mapped[str] = mapped_column(String(255), nullable=False)
    residential_address: Mapped[str] = mapped_column(Text, nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    pincode: Mapped[str] = mapped_column(String(10), nullable=False)
    
    # Parent/Guardian Information (stored as JSON)
    primary_guardian: Mapped[dict] = mapped_column(JSON, nullable=False)
    secondary_guardian: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    # Previous School (stored as JSON)
    previous_school: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    # Additional Information
    medical_conditions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    allergies: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    special_needs: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    how_did_you_hear: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    additional_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Consent
    terms_accepted: Mapped[bool] = mapped_column(Boolean, default=False)
    data_privacy_accepted: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Status & Metadata
    status: Mapped[str] = mapped_column(String(20), default=AdmissionStatus.PENDING.value)
    submitted_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    submitted_by: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    reviewer: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    reviewer_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Class Admission Information
    admitted_class: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    admitted_section: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    roll_number: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    admitted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    admitted_by: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Soft Delete
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    def __repr__(self) -> str:
        return f"<AdmissionRequest(id={self.id}, student={self.student_name}, status={self.status})>"


class StudentMark(Base):
    """Student marks / exam results."""

    __tablename__ = "student_marks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    student_id: Mapped[str] = mapped_column(String(8), ForeignKey("admission_requests.id"), nullable=False)

    exam_name: Mapped[str] = mapped_column(String(100), nullable=False)
    subject: Mapped[str] = mapped_column(String(100), nullable=False)
    marks_obtained: Mapped[float] = mapped_column(Float, nullable=False)
    max_marks: Mapped[float] = mapped_column(Float, nullable=False, default=100)
    grade: Mapped[Optional[str]] = mapped_column(String(5), nullable=True)
    academic_year: Mapped[str] = mapped_column(String(20), nullable=False)
    remarks: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<StudentMark(student={self.student_id}, exam={self.exam_name}, subject={self.subject})>"


class ClassHistory(Base):
    """Track class / section changes for a student over the years."""

    __tablename__ = "class_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    student_id: Mapped[str] = mapped_column(String(8), ForeignKey("admission_requests.id"), nullable=False)

    academic_year: Mapped[str] = mapped_column(String(20), nullable=False)
    class_name: Mapped[str] = mapped_column(String(50), nullable=False)
    section: Mapped[str] = mapped_column(String(10), nullable=False)
    roll_number: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    remarks: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<ClassHistory(student={self.student_id}, year={self.academic_year}, class={self.class_name})>"


class QuestionPaper(Base):
    """Question paper model."""

    __tablename__ = "question_papers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    subject: Mapped[str] = mapped_column(String(100), nullable=False)
    class_name: Mapped[str] = mapped_column(String(50), nullable=False)
    academic_year: Mapped[str] = mapped_column(String(20), nullable=False)
    exam_type: Mapped[str] = mapped_column(String(50), nullable=False)  # midterm, final, unit_test, quarterly, half_yearly
    total_marks: Mapped[float] = mapped_column(Float, nullable=False, default=100)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=180)
    instructions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="draft")  # draft, review, approved, published
    created_by: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    approved_by: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    content_blocks: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    questions: Mapped[list["QuestionPaperQuestion"]] = relationship(
        "QuestionPaperQuestion", back_populates="question_paper", cascade="all, delete-orphan",
        order_by="QuestionPaperQuestion.question_number",
    )

    def __repr__(self) -> str:
        return f"<QuestionPaper(id={self.id}, title={self.title}, status={self.status})>"


class QuestionPaperQuestion(Base):
    """Individual question within a question paper."""

    __tablename__ = "question_paper_questions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    question_paper_id: Mapped[int] = mapped_column(Integer, ForeignKey("question_papers.id"), nullable=False)
    question_number: Mapped[int] = mapped_column(Integer, nullable=False)
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    question_type: Mapped[str] = mapped_column(String(30), nullable=False, default="descriptive")  # mcq, short_answer, long_answer, descriptive, fill_in_blank
    marks: Mapped[float] = mapped_column(Float, nullable=False)
    options: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # For MCQ: {"a": "...", "b": "...", "correct": "a"}
    expected_answer: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    section: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # A, B, C etc.

    question_paper: Mapped["QuestionPaper"] = relationship("QuestionPaper", back_populates="questions")

    def __repr__(self) -> str:
        return f"<QuestionPaperQuestion(paper={self.question_paper_id}, q={self.question_number})>"


class Exam(Base):
    """Exam event – groups multiple class/subject entries."""

    __tablename__ = "exams"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    academic_year: Mapped[str] = mapped_column(String(20), nullable=False)
    exam_type: Mapped[str] = mapped_column(String(50), nullable=False)
    exam_date: Mapped[date] = mapped_column(Date, nullable=False)
    paper_selection_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="draft")  # draft, papers_attached, paper_selected, conducted
    created_by: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    class_papers: Mapped[list["ExamClassPaper"]] = relationship(
        "ExamClassPaper", back_populates="exam", cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Exam(id={self.id}, name={self.name}, status={self.status})>"


class ExamClassPaper(Base):
    """One class+subject row within an exam event, holding up to 3 paper sets."""

    __tablename__ = "exam_class_papers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    exam_id: Mapped[int] = mapped_column(Integer, ForeignKey("exams.id", ondelete="CASCADE"), nullable=False)
    class_name: Mapped[str] = mapped_column(String(50), nullable=False)
    subject: Mapped[str] = mapped_column(String(100), nullable=False)

    paper_set_a_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("question_papers.id"), nullable=True)
    paper_set_b_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("question_papers.id"), nullable=True)
    paper_set_c_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("question_papers.id"), nullable=True)

    selected_set: Mapped[Optional[str]] = mapped_column(String(1), nullable=True)  # A, B, or C
    selected_paper_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("question_papers.id"), nullable=True)
    selected_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    exam: Mapped["Exam"] = relationship("Exam", back_populates="class_papers")
    paper_set_a: Mapped[Optional["QuestionPaper"]] = relationship("QuestionPaper", foreign_keys=[paper_set_a_id])
    paper_set_b: Mapped[Optional["QuestionPaper"]] = relationship("QuestionPaper", foreign_keys=[paper_set_b_id])
    paper_set_c: Mapped[Optional["QuestionPaper"]] = relationship("QuestionPaper", foreign_keys=[paper_set_c_id])
    selected_paper: Mapped[Optional["QuestionPaper"]] = relationship("QuestionPaper", foreign_keys=[selected_paper_id])

    def __repr__(self) -> str:
        return f"<ExamClassPaper(exam={self.exam_id}, class={self.class_name}, subject={self.subject})>"


class StudentResult(Base):
    """Individual student result per exam/subject, with optional PDF attachment."""

    __tablename__ = "student_results"
    __table_args__ = (
        UniqueConstraint("exam_id", "student_id", "subject", name="uq_result_exam_student_subject"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    exam_id: Mapped[int] = mapped_column(Integer, ForeignKey("exams.id", ondelete="CASCADE"), nullable=False)
    student_id: Mapped[str] = mapped_column(String(8), ForeignKey("admission_requests.id"), nullable=False)
    class_name: Mapped[str] = mapped_column(String(50), nullable=False)
    subject: Mapped[str] = mapped_column(String(100), nullable=False)
    marks_obtained: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    max_marks: Mapped[float] = mapped_column(Float, nullable=False, default=100)
    grade: Mapped[Optional[str]] = mapped_column(String(5), nullable=True)
    remarks: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # PDF storage for future RAG
    pdf_filename: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    pdf_data: Mapped[Optional[bytes]] = mapped_column(LargeBinary, nullable=True)
    pdf_content_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    uploaded_by: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    exam: Mapped["Exam"] = relationship("Exam", backref="results")
    student: Mapped["AdmissionRequest"] = relationship("AdmissionRequest", backref="results")

    def __repr__(self) -> str:
        return f"<StudentResult(exam={self.exam_id}, student={self.student_id}, subject={self.subject})>"
