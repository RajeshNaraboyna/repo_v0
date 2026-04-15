"""create student_marks and class_history tables

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-04-13 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, None] = 'b2c3d4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'student_marks',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('student_id', sa.String(length=8), sa.ForeignKey('admission_requests.id'), nullable=False),
        sa.Column('exam_name', sa.String(length=100), nullable=False),
        sa.Column('subject', sa.String(length=100), nullable=False),
        sa.Column('marks_obtained', sa.Float(), nullable=False),
        sa.Column('max_marks', sa.Float(), nullable=False, server_default='100'),
        sa.Column('grade', sa.String(length=5), nullable=True),
        sa.Column('academic_year', sa.String(length=20), nullable=False),
        sa.Column('remarks', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table(
        'class_history',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('student_id', sa.String(length=8), sa.ForeignKey('admission_requests.id'), nullable=False),
        sa.Column('academic_year', sa.String(length=20), nullable=False),
        sa.Column('class_name', sa.String(length=50), nullable=False),
        sa.Column('section', sa.String(length=10), nullable=False),
        sa.Column('roll_number', sa.String(length=20), nullable=True),
        sa.Column('start_date', sa.Date(), nullable=True),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('remarks', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    op.drop_table('class_history')
    op.drop_table('student_marks')
