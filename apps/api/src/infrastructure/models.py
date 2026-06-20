from datetime import UTC, date, datetime
from decimal import Decimal

from sqlalchemy import (
    JSON,
    Boolean,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.infrastructure.database import Base


def utcnow() -> datetime:
    return datetime.now(UTC)


class SourceModel(Base):
    __tablename__ = "sources"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    attribution: Mapped[str] = mapped_column(String(255), nullable=False)
    homepage_url: Mapped[str] = mapped_column(String(500), nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    jobs: Mapped[list["JobModel"]] = relationship(back_populates="source")


class PipelineRunModel(Base):
    __tablename__ = "pipeline_runs"

    id: Mapped[int] = mapped_column(primary_key=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="running")
    requested_sources: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    fetched_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    loaded_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    discarded_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    error_message: Mapped[str | None] = mapped_column(Text)

    source_runs: Mapped[list["PipelineSourceRunModel"]] = relationship(
        back_populates="pipeline_run", cascade="all, delete-orphan"
    )


class PipelineSourceRunModel(Base):
    __tablename__ = "pipeline_source_runs"
    __table_args__ = (UniqueConstraint("pipeline_run_id", "source_name"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    pipeline_run_id: Mapped[int] = mapped_column(
        ForeignKey("pipeline_runs.id", ondelete="CASCADE"), nullable=False
    )
    source_name: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="running")
    fetched_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    error_message: Mapped[str | None] = mapped_column(Text)

    pipeline_run: Mapped[PipelineRunModel] = relationship(back_populates="source_runs")


class RawJobIndexModel(Base):
    __tablename__ = "raw_jobs_index"
    __table_args__ = (UniqueConstraint("source_id", "external_id", "content_hash"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    source_id: Mapped[int] = mapped_column(ForeignKey("sources.id"), nullable=False)
    external_id: Mapped[str] = mapped_column(String(255), nullable=False)
    raw_path: Mapped[str] = mapped_column(String(1000), nullable=False)
    content_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    fetched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class CompanyModel(Base):
    __tablename__ = "companies"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    normalized_name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)

    jobs: Mapped[list["JobModel"]] = relationship(back_populates="company")


class LocationModel(Base):
    __tablename__ = "locations"
    __table_args__ = (UniqueConstraint("name", "country_code"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    country_code: Mapped[str | None] = mapped_column(String(2))

    jobs: Mapped[list["JobModel"]] = relationship(back_populates="location")


class JobTechnologyModel(Base):
    __tablename__ = "job_technologies"

    job_id: Mapped[int] = mapped_column(ForeignKey("jobs.id", ondelete="CASCADE"), primary_key=True)
    technology_id: Mapped[int] = mapped_column(
        ForeignKey("technologies.id", ondelete="CASCADE"), primary_key=True
    )


class TechnologyModel(Base):
    __tablename__ = "technologies"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)

    jobs: Mapped[list["JobModel"]] = relationship(
        secondary="job_technologies", back_populates="technologies"
    )


class JobModel(Base):
    __tablename__ = "jobs"
    __table_args__ = (
        UniqueConstraint("source_id", "external_id", name="uq_job_source_external"),
        Index("ix_jobs_published_at", "published_at"),
        Index("ix_jobs_role", "role"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    source_id: Mapped[int] = mapped_column(ForeignKey("sources.id"), nullable=False)
    external_id: Mapped[str] = mapped_column(String(255), nullable=False)
    source_url: Mapped[str] = mapped_column(String(1000), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"), nullable=False)
    location_id: Mapped[int | None] = mapped_column(ForeignKey("locations.id"))
    location_raw: Mapped[str | None] = mapped_column(String(500))
    description: Mapped[str | None] = mapped_column(Text)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    fetched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    remote: Mapped[bool | None] = mapped_column(Boolean)
    modality: Mapped[str | None] = mapped_column(String(30))
    salary_min: Mapped[int | None] = mapped_column(Integer)
    salary_max: Mapped[int | None] = mapped_column(Integer)
    salary_currency: Mapped[str | None] = mapped_column(String(3))
    salary_period: Mapped[str | None] = mapped_column(String(20))
    role: Mapped[str | None] = mapped_column(String(50))
    seniority: Mapped[str | None] = mapped_column(String(50))
    experience_min_years: Mapped[int | None] = mapped_column(Integer)
    experience_max_years: Mapped[int | None] = mapped_column(Integer)
    seniority_source: Mapped[str | None] = mapped_column(String(30))
    seniority_confidence: Mapped[float | None] = mapped_column(Float)
    seniority_reason: Mapped[str | None] = mapped_column(String(500))
    quality_score: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    duplicate_group_id: Mapped[str | None] = mapped_column(String(64), index=True)
    first_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )
    last_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )

    source: Mapped[SourceModel] = relationship(back_populates="jobs")
    company: Mapped[CompanyModel] = relationship(back_populates="jobs")
    location: Mapped[LocationModel | None] = relationship(back_populates="jobs")
    technologies: Mapped[list[TechnologyModel]] = relationship(
        secondary="job_technologies", back_populates="jobs"
    )


class WeeklyTechnologyStatModel(Base):
    __tablename__ = "weekly_technology_stats"
    __table_args__ = (UniqueConstraint("week_start", "technology_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    week_start: Mapped[date] = mapped_column(Date, nullable=False)
    technology_id: Mapped[int] = mapped_column(ForeignKey("technologies.id"), nullable=False)
    job_count: Mapped[int] = mapped_column(Integer, nullable=False)
    share: Mapped[Decimal | None] = mapped_column(Numeric(8, 5))

    technology: Mapped[TechnologyModel] = relationship()
