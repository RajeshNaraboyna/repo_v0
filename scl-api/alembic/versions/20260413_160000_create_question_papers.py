"""create question papers tables

Revision ID: a1b2c3d4e5f6
Revises: 20260413_150000
Create Date: 2026-04-13 16:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "d4e5f6a7b8c9"
down_revision: Union[str, None] = "c3d4e5f6a7b8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "question_papers",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("subject", sa.String(length=100), nullable=False),
        sa.Column("class_name", sa.String(length=50), nullable=False),
        sa.Column("academic_year", sa.String(length=20), nullable=False),
        sa.Column("exam_type", sa.String(length=50), nullable=False),
        sa.Column("total_marks", sa.Float(), nullable=False, server_default="100"),
        sa.Column("duration_minutes", sa.Integer(), nullable=False, server_default="180"),
        sa.Column("instructions", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="draft"),
        sa.Column("created_by", sa.String(length=255), nullable=True),
        sa.Column("approved_by", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "question_paper_questions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("question_paper_id", sa.Integer(), nullable=False),
        sa.Column("question_number", sa.Integer(), nullable=False),
        sa.Column("question_text", sa.Text(), nullable=False),
        sa.Column("question_type", sa.String(length=30), nullable=False, server_default="descriptive"),
        sa.Column("marks", sa.Float(), nullable=False),
        sa.Column("options", sa.JSON(), nullable=True),
        sa.Column("expected_answer", sa.Text(), nullable=True),
        sa.Column("section", sa.String(length=20), nullable=True),
        sa.ForeignKeyConstraint(["question_paper_id"], ["question_papers.id"]),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("question_paper_questions")
    op.drop_table("question_papers")
