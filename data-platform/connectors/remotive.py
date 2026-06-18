from datetime import UTC, datetime

import httpx
from schemas.raw_job import RawJob
from src.config import settings

from connectors.base import BaseJobConnector, parse_datetime, request_with_retry


class RemotiveConnector(BaseJobConnector):
    source_name = "remotive"
    endpoint = "https://remotive.com/api/remote-jobs"

    def __init__(self, client: httpx.Client | None = None) -> None:
        self.client = client or httpx.Client(
            timeout=settings.external_request_timeout_seconds, follow_redirects=True
        )

    def fetch(self, limit: int | None = None) -> list[RawJob]:
        params = {"limit": limit} if limit is not None else None
        response = request_with_retry(self.client, self.endpoint, params=params)
        records = response.json().get("jobs", [])
        if limit is not None:
            records = records[:limit]
        fetched_at = datetime.now(UTC)
        return [self._map(item, fetched_at) for item in records]

    def _map(self, item: dict, fetched_at: datetime) -> RawJob:
        return RawJob(
            source_name=self.source_name,
            external_id=str(item["id"]),
            source_url=item["url"],
            title=item.get("title") or "Untitled",
            company_name=item.get("company_name") or "Unknown",
            location_raw=item.get("candidate_required_location"),
            description_raw=item.get("description"),
            published_at=parse_datetime(item.get("publication_date")),
            fetched_at=fetched_at,
            raw_payload=item,
            remote_hint=True,
            salary_raw=item.get("salary"),
            tags=[item["category"]] if item.get("category") else [],
        )
