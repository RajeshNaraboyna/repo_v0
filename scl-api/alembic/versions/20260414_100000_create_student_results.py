"""create student_results table

Revision ID: a1b2c3d4e5f6
Revises: f6a7b8c9d0e1
Create Date: 2026-04-14 10:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "g7h8i9j0k1l2"
down_revision: Union[str, None] = "f6a7b8c9d0e1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "student_results",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("exam_id", sa.Integer(), nullable=False),
        sa.Column("student_id", sa.String(8), nullable=False),
        sa.Column("class_name", sa.String(50), nullable=False),
        sa.Column("subject", sa.String(100), nullable=False),
        sa.Column("marks_obtained", sa.Float(), nullable=True),
        sa.Column("max_marks", sa.Float(), nullable=False, server_default="100"),
        sa.Column("grade", sa.String(5), nullable=True),
        sa.Column("remarks", sa.Text(), nullable=True),
        sa.Column("pdf_filename", sa.String(255), nullable=True),
        sa.Column("pdf_data", sa.LargeBinary(), nullable=True),
        sa.Column("pdf_content_type", sa.String(100), nullable=True),
        sa.Column("uploaded_by", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["exam_id"], ["exams.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["student_id"], ["admission_requests.id"]),
        sa.UniqueConstraint("exam_id", "student_id", "subject", name="uq_result_exam_student_subject"),
    )


def downgrade() -> None:
    op.drop_table("student_results")
