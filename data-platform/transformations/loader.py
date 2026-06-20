import hashlib
import json
from collections import Counter
from datetime import date, datetime, timedelta
from pathlib import Path

from sqlalchemy import delete, select
from sqlalchemy.orm import Session
from src.domain.entities import NormalizedJob
from src.infrastructure.models import (
    CompanyModel,
    JobModel,
    LocationModel,
    RawJobIndexModel,
    SourceModel,
    TechnologyModel,
    WeeklyTechnologyStatModel,
)

SOURCE_METADATA = {
    "adzuna": ("Jobs provided by Adzuna", "https://www.adzuna.es/"),
    "arbeitnow": ("Jobs provided by Arbeitnow", "https://www.arbeitnow.com/"),
    "remotive": ("Jobs provided by Remotive", "https://remotive.com/"),
    "greenhouse": ("Jobs provided by Greenhouse job boards", "https://www.greenhouse.com/"),
}


def get_or_create_source(session: Session, name: str) -> SourceModel:
    source = session.scalar(select(SourceModel).where(SourceModel.name == name))
    if source:
        return source
    attribution, homepage = SOURCE_METADATA.get(
        name, (f"Jobs provided by {name}", "https://example.com")
    )
    source = SourceModel(name=name, attribution=attribution, homepage_url=homepage)
    session.add(source)
    session.flush()
    return source


def index_raw_job(session: Session, source: SourceModel, raw_job: dict, raw_path: str) -> None:
    payload = json.dumps(raw_job.get("raw_payload", {}), sort_keys=True, ensure_ascii=False)
    content_hash = hashlib.sha256(payload.encode()).hexdigest()
    exists = session.scalar(
        select(RawJobIndexModel.id).where(
            RawJobIndexModel.source_id == source.id,
            RawJobIndexModel.external_id == str(raw_job["external_id"]),
            RawJobIndexModel.content_hash == content_hash,
        )
    )
    if not exists:
        session.add(
            RawJobIndexModel(
                source_id=source.id,
                external_id=str(raw_job["external_id"]),
                raw_path=raw_path,
                content_hash=content_hash,
                fetched_at=datetime.fromisoformat(raw_job["fetched_at"]),
            )
        )


def _get_company(session: Session, name: str) -> CompanyModel:
    normalized = " ".join(name.lower().split())
    company = session.scalar(select(CompanyModel).where(CompanyModel.normalized_name == normalized))
    if not company:
        company = CompanyModel(name=name, normalized_name=normalized)
        session.add(company)
        session.flush()
    return company


def _get_location(session: Session, name: str | None, country: str | None) -> LocationModel | None:
    if not name:
        return None
    statement = select(LocationModel).where(LocationModel.name == name)
    statement = statement.where(
        LocationModel.country_code.is_(None)
        if country is None
        else LocationModel.country_code == country
    )
    location = session.scalar(statement)
    if not location:
        location = LocationModel(name=name, country_code=country)
        session.add(location)
        session.flush()
    return location


def _get_technologies(session: Session, names: list[str]) -> list[TechnologyModel]:
    if not names:
        return []
    existing = {
        item.name: item
        for item in session.scalars(select(TechnologyModel).where(TechnologyModel.name.in_(names)))
    }
    for name in names:
        if name not in existing:
            existing[name] = TechnologyModel(name=name)
            session.add(existing[name])
    session.flush()
    return [existing[name] for name in names]


def upsert_job(session: Session, job: NormalizedJob) -> JobModel:
    source = get_or_create_source(session, job.source_name)
    company = _get_company(session, job.company_name)
    location = _get_location(session, job.location_name, job.country_code)
    model = session.scalar(
        select(JobModel).where(
            JobModel.source_id == source.id, JobModel.external_id == job.external_id
        )
    )
    if not model:
        model = JobModel(
            source_id=source.id,
            external_id=job.external_id,
            company_id=company.id,
            first_seen_at=job.fetched_at,
        )
        session.add(model)
    model.source_url = job.source_url
    model.title = job.title
    model.company = company
    model.location = location
    model.location_raw = job.location_raw
    model.description = job.description
    model.published_at = job.published_at
    model.fetched_at = job.fetched_at
    model.remote = job.remote
    model.modality = job.modality
    model.salary_min = job.salary_min
    model.salary_max = job.salary_max
    model.salary_currency = job.salary_currency
    model.salary_period = job.salary_period
    model.role = job.role
    model.seniority = job.seniority
    model.experience_min_years = job.experience_min_years
    model.experience_max_years = job.experience_max_years
    model.seniority_source = job.seniority_source
    model.seniority_confidence = job.seniority_confidence
    model.seniority_reason = job.seniority_reason
    model.quality_score = job.quality_score
    model.duplicate_group_id = job.duplicate_group_id
    model.last_seen_at = job.fetched_at
    model.is_active = True
    model.closed_at = None
    model.technologies = _get_technologies(session, job.technologies)
    session.flush()
    return model


def mark_missing_jobs_inactive(
    session: Session, source_name: str, seen_external_ids: set[str], observed_at: datetime
) -> int:
    source = session.scalar(select(SourceModel).where(SourceModel.name == source_name))
    if not source:
        return 0
    statement = select(JobModel).where(
        JobModel.source_id == source.id,
        JobModel.is_active.is_(True),
    )
    changed = 0
    for model in session.scalars(statement):
        if model.external_id not in seen_external_ids:
            model.is_active = False
            model.closed_at = observed_at
            changed += 1
    return changed


def retain_cross_source_duplicate_groups(session: Session) -> None:
    candidates = session.scalars(
        select(JobModel).where(JobModel.duplicate_group_id.is_not(None))
    ).all()
    source_sets: dict[str, set[int]] = {}
    for job in candidates:
        source_sets.setdefault(job.duplicate_group_id or "", set()).add(job.source_id)
    for job in candidates:
        if len(source_sets.get(job.duplicate_group_id or "", set())) < 2:
            job.duplicate_group_id = None


def rebuild_weekly_stats(session: Session) -> list[dict]:
    session.execute(delete(WeeklyTechnologyStatModel))
    jobs = session.scalars(select(JobModel)).unique().all()
    by_week: dict[date, Counter[str]] = {}
    week_totals: Counter[date] = Counter()
    for job in jobs:
        timestamp = job.published_at or job.fetched_at
        week_start = timestamp.date() - timedelta(days=timestamp.weekday())
        week_totals[week_start] += 1
        counter = by_week.setdefault(week_start, Counter())
        counter.update(technology.name for technology in job.technologies)
    technologies = {tech.name: tech for tech in session.scalars(select(TechnologyModel))}
    output = []
    for week_start, counts in sorted(by_week.items()):
        for name, count in sorted(counts.items()):
            share = count / week_totals[week_start] if week_totals[week_start] else None
            session.add(
                WeeklyTechnologyStatModel(
                    week_start=week_start,
                    technology_id=technologies[name].id,
                    job_count=count,
                    share=share,
                )
            )
            output.append(
                {
                    "week_start": week_start.isoformat(),
                    "technology": name,
                    "job_count": count,
                    "share": round(share, 5) if share is not None else None,
                }
            )
    session.flush()
    return output


def load_processed_file(session: Session, path: Path) -> int:
    count = 0
    with path.open(encoding="utf-8") as handle:
        for line in handle:
            if not line.strip():
                continue
            payload = json.loads(line)
            for key in ("published_at", "fetched_at"):
                payload[key] = datetime.fromisoformat(payload[key]) if payload.get(key) else None
            upsert_job(session, NormalizedJob(**payload))
            count += 1
    return count
