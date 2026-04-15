"""add class admission fields

Revision ID: a1b2c3d4e5f6
Revises: 3766cd42102f
Create Date: 2026-04-13 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '3766cd42102f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add class admission fields to admission_requests table
    op.add_column('admission_requests', sa.Column('admitted_class', sa.String(length=50), nullable=True))
    op.add_column('admission_requests', sa.Column('admitted_section', sa.String(length=10), nullable=True))
    op.add_column('admission_requests', sa.Column('roll_number', sa.String(length=20), nullable=True))
    op.add_column('admission_requests', sa.Column('admitted_at', sa.DateTime(), nullable=True))
    op.add_column('admission_requests', sa.Column('admitted_by', sa.String(length=255), nullable=True))


def downgrade() -> None:
    # Remove class admission fields from admission_requests table
    op.drop_column('admission_requests', 'admitted_by')
    op.drop_column('admission_requests', 'admitted_at')
    op.drop_column('admission_requests', 'roll_number')
    op.drop_column('admission_requests', 'admitted_section')
    op.drop_column('admission_requests', 'admitted_class')
