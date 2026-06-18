from dataclasses import asdict, dataclass, field
from datetime import UTC, datetime
from typing import Any


def ensure_utc(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


@dataclass(slots=True)
class RawJob:
    source_name: str
    external_id: str
    source_url: str
    title: str
    company_name: str
    location_raw: str | None = None
    description_raw: str | None = None
    published_at: datetime | None = None
    fetched_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    raw_payload: dict[str, Any] = field(default_factory=dict)
    remote_hint: bool | None = None
    salary_raw: str | None = None
    tags: list[str] = field(default_factory=list)

    def __post_init__(self) -> None:
        if not self.source_name or not self.source_url:
            raise ValueError("source_name and source_url are required")
        self.external_id = str(self.external_id)
        self.published_at = ensure_utc(self.published_at)
        self.fetched_at = ensure_utc(self.fetched_at) or datetime.now(UTC)

    def as_dict(self) -> dict[str, Any]:
        result = asdict(self)
        result["published_at"] = self.published_at.isoformat() if self.published_at else None
        result["fetched_at"] = self.fetched_at.isoformat()
        return result
