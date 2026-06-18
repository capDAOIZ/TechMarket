import time
from datetime import UTC, datetime

import httpx
from schemas.raw_job import RawJob
from src.config import settings

from connectors.base import BaseJobConnector, parse_datetime, request_with_retry


class GreenhouseConnector(BaseJobConnector):
    source_name = "greenhouse"
    endpoint = "https://boards-api.greenhouse.io/v1/boards/{board}/jobs"
    default_boards = ("stripe", "databricks", "anthropic", "gitlab", "figma")

    def __init__(
        self, client: httpx.Client | None = None, boards: tuple[str, ...] | None = None
    ) -> None:
        self.client = client or httpx.Client(
            timeout=settings.external_request_timeout_seconds, follow_redirects=True
        )
        self.boards = boards or self.default_boards

    def fetch(self, limit: int | None = None) -> list[RawJob]:
        results: list[RawJob] = []
        fetched_at = datetime.now(UTC)
        for board in self.boards:
            remaining = None if limit is None else limit - len(results)
            if remaining is not None and remaining <= 0:
                break
            response = request_with_retry(
                self.client,
                self.endpoint.format(board=board),
                params={"content": "true"},
            )
            records = response.json().get("jobs", [])
            if remaining is not None:
                records = records[:remaining]
            results.extend(self._map(item, board, fetched_at) for item in records)
            if board != self.boards[-1]:
                time.sleep(settings.external_request_delay_seconds)
        return results

    def _map(self, item: dict, board: str, fetched_at: datetime) -> RawJob:
        location = (item.get("location") or {}).get("name")
        remote = "remote" in (location or "").lower() or "remote" in item.get("title", "").lower()
        return RawJob(
            source_name=self.source_name,
            external_id=f"{board}:{item['id']}",
            source_url=item["absolute_url"],
            title=item.get("title") or "Untitled",
            company_name=board.title(),
            location_raw=location,
            description_raw=item.get("content"),
            published_at=parse_datetime(item.get("updated_at")),
            fetched_at=fetched_at,
            raw_payload={**item, "board": board},
            remote_hint=remote,
            salary_raw=None,
            tags=[department["name"] for department in item.get("departments", [])],
        )
