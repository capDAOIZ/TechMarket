"""Add job lifecycle and per-source pipeline runs.

Revision ID: 0002
Revises: 0001
"""

import sqlalchemy as sa
from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "pipeline_source_runs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("pipeline_run_id", sa.Integer(), nullable=False),
        sa.Column("source_name", sa.String(length=100), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("fetched_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["pipeline_run_id"], ["pipeline_runs.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("pipeline_run_id", "source_name"),
    )
    op.add_column("jobs", sa.Column("first_seen_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("jobs", sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column(
        "jobs", sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true())
    )
    op.add_column("jobs", sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True))
    op.execute(
        "UPDATE jobs SET first_seen_at = COALESCE(created_at, fetched_at), "
        "last_seen_at = COALESCE(updated_at, fetched_at)"
    )
    op.alter_column("jobs", "first_seen_at", nullable=False)
    op.alter_column("jobs", "last_seen_at", nullable=False)
    op.create_index("ix_jobs_is_active", "jobs", ["is_active"])


def downgrade() -> None:
    op.drop_index("ix_jobs_is_active", table_name="jobs")
    op.drop_column("jobs", "closed_at")
    op.drop_column("jobs", "is_active")
    op.drop_column("jobs", "last_seen_at")
    op.drop_column("jobs", "first_seen_at")
    op.drop_table("pipeline_source_runs")
