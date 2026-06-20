"""Add auditable seniority evidence.

Revision ID: 0003
Revises: 0002
"""

import sqlalchemy as sa
from alembic import op

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("jobs", sa.Column("experience_min_years", sa.Integer(), nullable=True))
    op.add_column("jobs", sa.Column("experience_max_years", sa.Integer(), nullable=True))
    op.add_column("jobs", sa.Column("seniority_source", sa.String(length=30), nullable=True))
    op.add_column("jobs", sa.Column("seniority_confidence", sa.Float(), nullable=True))
    op.add_column("jobs", sa.Column("seniority_reason", sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column("jobs", "seniority_reason")
    op.drop_column("jobs", "seniority_confidence")
    op.drop_column("jobs", "seniority_source")
    op.drop_column("jobs", "experience_max_years")
    op.drop_column("jobs", "experience_min_years")
