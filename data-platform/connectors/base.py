import time
from abc import ABC, abstractmethod
from datetime import UTC, datetime

import httpx
from schemas.raw_job import RawJob
from src.config import settings


def parse_datetime(value: str | int | float | None) -> datetime | None:
    if not value:
        return None
    if isinstance(value, (int, float)):
        return datetime.fromtimestamp(value, tz=UTC)
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        for pattern in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%d"):
            try:
                parsed = datetime.strptime(value, pattern)
                break
            except ValueError:
                continue
        else:
            return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=UTC)
    return parsed.astimezone(UTC)


class BaseJobConnector(ABC):
    source_name: str

    @abstractmethod
    def fetch(self, limit: int | None = None) -> list[RawJob]: ...


def request_with_retry(
    client: httpx.Client, url: str, *, params: dict | None = None
) -> httpx.Response:
    attempts = settings.external_request_max_retries + 1
    for attempt in range(attempts):
        try:
            response = client.get(url, params=params)
            response.raise_for_status()
            return response
        except httpx.HTTPError as exc:
            status = exc.response.status_code if isinstance(exc, httpx.HTTPStatusError) else None
            retryable = status is None or status == 429 or status >= 500
            if not retryable or attempt == attempts - 1:
                raise
            time.sleep(settings.external_request_backoff_seconds * (2**attempt))
    raise RuntimeError("unreachable")
