"""add soft delete fields

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-04-13 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add soft delete fields to admission_requests table
    op.add_column('admission_requests', sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default=sa.text('false')))
    op.add_column('admission_requests', sa.Column('deleted_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    # Remove soft delete fields from admission_requests table
    op.drop_column('admission_requests', 'deleted_at')
    op.drop_column('admission_requests', 'is_deleted')
