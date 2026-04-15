"""create exams and exam_class_papers tables

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-04-13 18:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "f6a7b8c9d0e1"
down_revision: Union[str, None] = "e5f6a7b8c9d0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # -- exams table --
    op.create_table(
        "exams",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("academic_year", sa.String(20), nullable=False),
        sa.Column("exam_type", sa.String(50), nullable=False),
        sa.Column("exam_date", sa.Date(), nullable=False),
        sa.Column("paper_selection_date", sa.Date(), nullable=False),
        sa.Column(
            "status",
            sa.String(20),
            nullable=False,
            server_default="draft",
        ),
        sa.Column("created_by", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )

    # -- exam_class_papers table --
    op.create_table(
        "exam_class_papers",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("exam_id", sa.Integer(), nullable=False),
        sa.Column("class_name", sa.String(50), nullable=False),
        sa.Column("subject", sa.String(100), nullable=False),
        sa.Column("paper_set_a_id", sa.Integer(), nullable=True),
        sa.Column("paper_set_b_id", sa.Integer(), nullable=True),
        sa.Column("paper_set_c_id", sa.Integer(), nullable=True),
        sa.Column("selected_set", sa.String(1), nullable=True),
        sa.Column("selected_paper_id", sa.Integer(), nullable=True),
        sa.Column("selected_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["exam_id"], ["exams.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["paper_set_a_id"], ["question_papers.id"]),
        sa.ForeignKeyConstraint(["paper_set_b_id"], ["question_papers.id"]),
        sa.ForeignKeyConstraint(["paper_set_c_id"], ["question_papers.id"]),
        sa.ForeignKeyConstraint(["selected_paper_id"], ["question_papers.id"]),
    )


def downgrade() -> None:
    op.drop_table("exam_class_papers")
    op.drop_table("exams")
