from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict

Role = Literal[
    "backend",
    "frontend",
    "fullstack",
    "data",
    "devops",
    "mobile",
    "qa",
    "security",
    "machine_learning",
    "management",
    "software",
]
Seniority = Literal["intern", "junior", "senior", "lead", "manager"]
Modality = Literal["remote", "hybrid", "onsite"]


class JobListItem(BaseModel):
    id: int
    title: str
    company_name: str
    location: str | None
    role: Role | None
    seniority: Seniority | None
    modality: Modality | None
    remote: bool | None
    technologies: list[str]
    published_at: datetime | None
    fetched_at: datetime
    salary_min: int | None
    salary_max: int | None
    salary_currency: str | None
    salary_period: str | None
    quality_score: float
    source_name: str
    source_url: str
    attribution: str
    first_seen_at: datetime
    last_seen_at: datetime
    is_active: bool
    closed_at: datetime | None


class JobDetail(JobListItem):
    external_id: str
    location_raw: str | None
    country_code: str | None
    description: str | None
    duplicate_group_id: str | None


class PaginatedJobsResponse(BaseModel):
    items: list[JobListItem]
    page: int
    page_size: int
    total: int
    total_pages: int


class DashboardSummary(BaseModel):
    total_jobs: int
    total_companies: int
    total_sources: int
    total_technologies: int
    latest_published_at: datetime | None
    remote_percentage: float
    salary_coverage_percentage: float
    last_ingestion_at: datetime | None


class TechnologyStat(BaseModel):
    technology: str
    count: int
    share: float | None


class BucketStat(BaseModel):
    value: str | None
    count: int


class TechnologyTrendPoint(BaseModel):
    week_start: date
    technology: str
    count: int
    share: float | None


class PipelineRun(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: Literal["running", "success", "partial_success", "failed"]
    requested_sources: list[str]
    started_at: datetime
    finished_at: datetime | None
    fetched_count: int
    loaded_count: int
    discarded_count: int
    error_message: str | None
    source_runs: list["PipelineSourceRun"]


class PipelineSourceRun(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    source_name: str
    status: Literal["running", "success", "failed"]
    fetched_count: int
    started_at: datetime
    finished_at: datetime | None
    error_message: str | None


class SourceResponse(BaseModel):
    id: int
    name: str
    attribution: str
    homepage_url: str
    active: bool


class HealthResponse(BaseModel):
    status: Literal["ok"]
    database: Literal["ok"]
