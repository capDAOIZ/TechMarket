from dataclasses import dataclass, field
from datetime import datetime
from typing import Any


@dataclass(slots=True)
class NormalizedJob:
    source_name: str
    external_id: str
    source_url: str
    title: str
    company_name: str
    location_raw: str | None
    location_name: str | None
    country_code: str | None
    description: str | None
    published_at: datetime | None
    fetched_at: datetime
    remote: bool | None
    modality: str | None
    salary_min: int | None
    salary_max: int | None
    salary_currency: str | None
    salary_period: str | None
    role: str | None
    seniority: str | None
    experience_min_years: int | None = None
    experience_max_years: int | None = None
    seniority_source: str | None = None
    seniority_confidence: float | None = None
    seniority_reason: str | None = None
    technologies: list[str] = field(default_factory=list)
    quality_score: float = 0.0
    duplicate_group_id: str | None = None
    raw_path: str | None = None

    def as_dict(self) -> dict[str, Any]:
        result = {name: getattr(self, name) for name in self.__dataclass_fields__}
        for key in ("published_at", "fetched_at"):
            value = result[key]
            result[key] = value.isoformat() if value else None
        return result
