import math
from typing import Any

from sqlalchemy import asc, desc, func, or_, select
from sqlalchemy.orm import Session, joinedload

from src.application.ports import JobReadRepository
from src.infrastructure.models import (
    CompanyModel,
    JobModel,
    SourceModel,
    TechnologyModel,
)
from src.presentation.schemas import JobDetail, JobListItem, PaginatedJobsResponse


def to_list_item(job: JobModel) -> JobListItem:
    return JobListItem(
        id=job.id,
        title=job.title,
        company_name=job.company.name,
        location=job.location.name if job.location else None,
        role=job.role,
        seniority=job.seniority,
        modality=job.modality,
        remote=job.remote,
        technologies=sorted(technology.name for technology in job.technologies),
        published_at=job.published_at,
        fetched_at=job.fetched_at,
        salary_min=job.salary_min,
        salary_max=job.salary_max,
        salary_currency=job.salary_currency,
        salary_period=job.salary_period,
        quality_score=job.quality_score,
        source_name=job.source.name,
        source_url=job.source_url,
        attribution=job.source.attribution,
        first_seen_at=job.first_seen_at,
        last_seen_at=job.last_seen_at,
        is_active=job.is_active,
        closed_at=job.closed_at,
    )


def to_detail(job: JobModel) -> JobDetail:
    base = to_list_item(job).model_dump()
    return JobDetail(
        **base,
        external_id=job.external_id,
        location_raw=job.location_raw,
        country_code=job.location.country_code if job.location else None,
        description=job.description,
        duplicate_group_id=job.duplicate_group_id,
    )


class SQLAlchemyJobRepository(JobReadRepository):
    def __init__(self, session: Session) -> None:
        self.session = session

    def list_jobs(self, **filters: Any) -> PaginatedJobsResponse:
        statement = select(JobModel).join(JobModel.company).join(JobModel.source)
        q = filters.get("q")
        if q:
            pattern = f"%{q.strip()}%"
            statement = statement.where(
                or_(
                    JobModel.title.ilike(pattern),
                    JobModel.description.ilike(pattern),
                    CompanyModel.name.ilike(pattern),
                )
            )
        technology = filters.get("technology")
        if technology:
            statement = statement.join(JobModel.technologies).where(
                func.lower(TechnologyModel.name) == technology.lower()
            )
        for field in ("role", "seniority", "modality", "remote"):
            value = filters.get(field)
            if value is not None:
                statement = statement.where(getattr(JobModel, field) == value)
        source = filters.get("source")
        if source:
            statement = statement.where(func.lower(SourceModel.name) == source.lower())
        active = filters.get("active", True)
        if active is not None:
            statement = statement.where(JobModel.is_active == active)

        count_statement = select(func.count()).select_from(statement.order_by(None).subquery())
        total = self.session.scalar(count_statement) or 0
        sort = filters.get("sort", "newest")
        order = {
            "newest": desc(JobModel.published_at).nulls_last(),
            "oldest": asc(JobModel.published_at).nulls_last(),
            "quality": desc(JobModel.quality_score),
        }[sort]
        page = filters.get("page", 1)
        page_size = filters.get("page_size", 20)
        statement = (
            statement.options(
                joinedload(JobModel.company),
                joinedload(JobModel.source),
                joinedload(JobModel.location),
                joinedload(JobModel.technologies),
            )
            .order_by(order, desc(JobModel.id))
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        jobs = self.session.scalars(statement).unique().all()
        return PaginatedJobsResponse(
            items=[to_list_item(job) for job in jobs],
            page=page,
            page_size=page_size,
            total=total,
            total_pages=math.ceil(total / page_size) if total else 0,
        )

    def get_job(self, job_id: int) -> JobDetail | None:
        statement = (
            select(JobModel)
            .where(JobModel.id == job_id)
            .options(
                joinedload(JobModel.company),
                joinedload(JobModel.source),
                joinedload(JobModel.location),
                joinedload(JobModel.technologies),
            )
        )
        job = self.session.scalar(statement)
        return to_detail(job) if job else None
