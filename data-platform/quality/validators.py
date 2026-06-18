from dataclasses import dataclass

from src.domain.entities import NormalizedJob


@dataclass(frozen=True)
class QualityResult:
    valid: bool
    errors: tuple[str, ...]


def validate_job(job: NormalizedJob) -> QualityResult:
    errors = []
    if not job.source_name:
        errors.append("source_name is required")
    if not job.source_url.startswith(("http://", "https://")):
        errors.append("source_url must be an HTTP URL")
    if not job.external_id:
        errors.append("external_id is required")
    if not job.title:
        errors.append("title is required")
    if not job.company_name:
        errors.append("company_name is required")
    if (
        job.salary_min is not None
        and job.salary_max is not None
        and job.salary_min > job.salary_max
    ):
        errors.append("salary_min cannot exceed salary_max")
    return QualityResult(valid=not errors, errors=tuple(errors))
