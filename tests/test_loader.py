from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session
from src.domain.entities import NormalizedJob
from src.infrastructure.models import JobModel
from transformations.loader import mark_missing_jobs_inactive, upsert_job


def make_job(title: str = "Backend Engineer") -> NormalizedJob:
    return NormalizedJob(
        source_name="arbeitnow",
        external_id="same-id",
        source_url="https://example.com/job",
        title=title,
        company_name="Acme",
        location_raw=None,
        location_name=None,
        country_code=None,
        description="Python and FastAPI",
        published_at=None,
        fetched_at=datetime.now(UTC),
        remote=None,
        modality=None,
        salary_min=None,
        salary_max=None,
        salary_currency=None,
        salary_period=None,
        role="backend",
        seniority="mid",
        experience_min_years=3,
        seniority_source="description",
        seniority_confidence=0.85,
        seniority_reason="Experience requirement maps to mid.",
        technologies=["Python", "FastAPI"],
        quality_score=0.9,
    )


def test_upsert_does_not_duplicate_source_external_id(session: Session) -> None:
    first = upsert_job(session, make_job())
    second = upsert_job(session, make_job("Updated Backend Engineer"))
    session.commit()
    assert first.id == second.id
    assert session.scalar(select(func.count(JobModel.id))) == 1
    assert session.scalar(select(JobModel.title)) == "Updated Backend Engineer"
    stored = session.scalar(select(JobModel))
    assert stored is not None
    assert stored.experience_min_years == 3
    assert stored.seniority_source == "description"


def test_missing_job_is_closed_and_reappearing_job_is_reactivated(session: Session) -> None:
    job = make_job()
    model = upsert_job(session, job)
    first_seen = model.first_seen_at
    mark_missing_jobs_inactive(session, "arbeitnow", set(), datetime.now(UTC))
    assert model.is_active is False
    assert model.closed_at is not None

    refreshed = upsert_job(session, make_job("Backend Engineer Again"))
    assert refreshed.is_active is True
    assert refreshed.closed_at is None
    assert refreshed.first_seen_at == first_seen
