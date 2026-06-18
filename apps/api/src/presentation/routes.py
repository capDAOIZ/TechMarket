from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from src.infrastructure.database import get_db
from src.infrastructure.models import (
    CompanyModel,
    JobModel,
    PipelineRunModel,
    SourceModel,
    TechnologyModel,
    WeeklyTechnologyStatModel,
)
from src.infrastructure.repositories import SQLAlchemyJobRepository
from src.presentation.schemas import (
    BucketStat,
    DashboardSummary,
    HealthResponse,
    JobDetail,
    Modality,
    PaginatedJobsResponse,
    PipelineRun,
    Role,
    Seniority,
    SourceResponse,
    TechnologyStat,
    TechnologyTrendPoint,
)

router = APIRouter()
DbSession = Annotated[Session, Depends(get_db)]


@router.get("/health", response_model=HealthResponse, tags=["system"])
def health(session: DbSession) -> HealthResponse:
    session.execute(text("SELECT 1"))
    return HealthResponse(status="ok", database="ok")


@router.get("/jobs", response_model=PaginatedJobsResponse, tags=["jobs"])
def list_jobs(
    session: DbSession,
    q: str | None = None,
    technology: str | None = None,
    role: Role | None = None,
    seniority: Seniority | None = None,
    modality: Modality | None = None,
    remote: bool | None = None,
    source: str | None = None,
    active: bool | None = True,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    sort: Literal["newest", "oldest", "quality"] = "newest",
) -> PaginatedJobsResponse:
    return SQLAlchemyJobRepository(session).list_jobs(
        q=q,
        technology=technology,
        role=role,
        seniority=seniority,
        modality=modality,
        remote=remote,
        source=source,
        active=active,
        page=page,
        page_size=page_size,
        sort=sort,
    )


@router.get("/jobs/{job_id}", response_model=JobDetail, tags=["jobs"])
def get_job(job_id: int, session: DbSession) -> JobDetail:
    job = SQLAlchemyJobRepository(session).get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.get("/stats/summary", response_model=DashboardSummary, tags=["statistics"])
def summary(session: DbSession) -> DashboardSummary:
    total_jobs = (
        session.scalar(select(func.count(JobModel.id)).where(JobModel.is_active.is_(True))) or 0
    )
    remote_jobs = (
        session.scalar(
            select(func.count(JobModel.id)).where(
                JobModel.is_active.is_(True), JobModel.remote.is_(True)
            )
        )
        or 0
    )
    salary_jobs = (
        session.scalar(
            select(func.count(JobModel.id)).where(
                JobModel.is_active.is_(True), JobModel.salary_min.is_not(None)
            )
        )
        or 0
    )
    return DashboardSummary(
        total_jobs=total_jobs,
        total_companies=session.scalar(select(func.count(CompanyModel.id))) or 0,
        total_sources=session.scalar(select(func.count(SourceModel.id))) or 0,
        total_technologies=session.scalar(select(func.count(TechnologyModel.id))) or 0,
        latest_published_at=session.scalar(select(func.max(JobModel.published_at))),
        remote_percentage=round(100 * remote_jobs / total_jobs, 2) if total_jobs else 0,
        salary_coverage_percentage=round(100 * salary_jobs / total_jobs, 2) if total_jobs else 0,
        last_ingestion_at=session.scalar(select(func.max(PipelineRunModel.finished_at))),
    )


@router.get("/stats/technologies", response_model=list[TechnologyStat], tags=["statistics"])
def technology_stats(session: DbSession) -> list[TechnologyStat]:
    total = session.scalar(select(func.count(JobModel.id)).where(JobModel.is_active.is_(True))) or 0
    statement = (
        select(TechnologyModel.name, func.count(JobModel.id))
        .join(TechnologyModel.jobs)
        .where(JobModel.is_active.is_(True))
        .group_by(TechnologyModel.name)
        .order_by(func.count(JobModel.id).desc(), TechnologyModel.name)
    )
    return [
        TechnologyStat(
            technology=name,
            count=count,
            share=round(count / total, 5) if total else None,
        )
        for name, count in session.execute(statement)
    ]


def _bucket_stats(session: Session, column: object) -> list[BucketStat]:
    statement = (
        select(column, func.count(JobModel.id))
        .select_from(JobModel)
        .where(JobModel.is_active.is_(True))
        .group_by(column)
        .order_by(func.count(JobModel.id).desc())
    )
    return [BucketStat(value=value, count=count) for value, count in session.execute(statement)]


@router.get("/stats/roles", response_model=list[BucketStat], tags=["statistics"])
def role_stats(session: DbSession) -> list[BucketStat]:
    return _bucket_stats(session, JobModel.role)


@router.get("/stats/seniority", response_model=list[BucketStat], tags=["statistics"])
def seniority_stats(session: DbSession) -> list[BucketStat]:
    return _bucket_stats(session, JobModel.seniority)


@router.get("/stats/modalities", response_model=list[BucketStat], tags=["statistics"])
def modality_stats(session: DbSession) -> list[BucketStat]:
    return _bucket_stats(session, JobModel.modality)


@router.get("/trends/technologies", response_model=list[TechnologyTrendPoint], tags=["statistics"])
def technology_trends(
    session: DbSession, technology: str | None = None
) -> list[TechnologyTrendPoint]:
    statement = select(WeeklyTechnologyStatModel).join(WeeklyTechnologyStatModel.technology)
    if technology:
        statement = statement.where(func.lower(TechnologyModel.name) == technology.lower())
    statement = statement.order_by(WeeklyTechnologyStatModel.week_start, TechnologyModel.name)
    return [
        TechnologyTrendPoint(
            week_start=row.week_start,
            technology=row.technology.name,
            count=row.job_count,
            share=float(row.share) if row.share is not None else None,
        )
        for row in session.scalars(statement)
    ]


@router.get("/pipeline-runs", response_model=list[PipelineRun], tags=["pipeline"])
def pipeline_runs(
    session: DbSession, limit: Annotated[int, Query(ge=1, le=100)] = 20
) -> list[PipelineRunModel]:
    return list(
        session.scalars(
            select(PipelineRunModel).order_by(PipelineRunModel.started_at.desc()).limit(limit)
        )
    )


@router.get("/sources", response_model=list[SourceResponse], tags=["sources"])
def sources(session: DbSession) -> list[SourceResponse]:
    records = session.scalars(select(SourceModel).order_by(SourceModel.name)).all()
    return [
        SourceResponse(
            id=source.id,
            name=source.name,
            attribution=source.attribution,
            homepage_url=source.homepage_url,
            active=source.active,
        )
        for source in records
    ]
