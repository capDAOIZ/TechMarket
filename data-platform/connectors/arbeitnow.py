from datetime import UTC, datetime

import httpx
from schemas.raw_job import RawJob
from src.config import settings

from connectors.base import BaseJobConnector, parse_datetime, request_with_retry


class ArbeitnowConnector(BaseJobConnector):
    source_name = "arbeitnow"
    endpoint = "https://www.arbeitnow.com/api/job-board-api"

    def __init__(self, client: httpx.Client | None = None) -> None:
        self.client = client or httpx.Client(
            timeout=settings.external_request_timeout_seconds, follow_redirects=True
        )

    def fetch(self, limit: int | None = None) -> list[RawJob]:
        response = request_with_retry(self.client, self.endpoint)
        records = response.json().get("data", [])
        if limit is not None:
            records = records[:limit]
        fetched_at = datetime.now(UTC)
        return [self._map(item, fetched_at) for item in records]

    def _map(self, item: dict, fetched_at: datetime) -> RawJob:
        remote = item.get("remote")
        return RawJob(
            source_name=self.source_name,
            external_id=str(item.get("slug") or item.get("id")),
            source_url=item.get("url") or f"https://www.arbeitnow.com/jobs/{item.get('slug')}",
            title=item.get("title") or "Untitled",
            company_name=item.get("company_name") or "Unknown",
            location_raw=item.get("location"),
            description_raw=item.get("description"),
            published_at=parse_datetime(item.get("created_at")),
            fetched_at=fetched_at,
            raw_payload=item,
            remote_hint=remote if isinstance(remote, bool) else None,
            salary_raw=item.get("salary"),
            tags=item.get("tags") or [],
        )
