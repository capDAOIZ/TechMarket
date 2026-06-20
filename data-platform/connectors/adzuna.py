from datetime import UTC, datetime

import httpx
from schemas.raw_job import RawJob
from src.config import settings

from connectors.base import BaseJobConnector, parse_datetime, request_with_retry


class AdzunaConnector(BaseJobConnector):
    source_name = "adzuna"
    endpoint = "https://api.adzuna.com/v1/api/jobs/{country}/search/{page}"

    def __init__(
        self,
        client: httpx.Client | None = None,
        app_id: str | None = None,
        app_key: str | None = None,
        country: str | None = None,
        category: str | None = None,
    ) -> None:
        self.client = client or httpx.Client(
            timeout=settings.external_request_timeout_seconds, follow_redirects=True
        )
        self.app_id = app_id or settings.adzuna_app_id
        self.app_key = app_key or settings.adzuna_app_key
        self.country = country or settings.adzuna_country
        self.category = settings.adzuna_category if category is None else category

    def fetch(self, limit: int | None = None) -> list[RawJob]:
        if not self.app_id or not self.app_key:
            raise RuntimeError("ADZUNA_APP_ID and ADZUNA_APP_KEY are required")

        target = limit if limit is not None else settings.adzuna_default_limit
        results: list[RawJob] = []
        fetched_at = datetime.now(UTC)
        page = 1
        while len(results) < target:
            page_size = min(50, target - len(results))
            params: dict[str, str | int] = {
                "app_id": self.app_id,
                "app_key": self.app_key,
                "results_per_page": page_size,
                "content-type": "application/json",
                "sort_by": "date",
            }
            if self.category:
                params["category"] = self.category
            response = request_with_retry(
                self.client,
                self.endpoint.format(country=self.country, page=page),
                params=params,
            )
            records = response.json().get("results", [])
            results.extend(self._map(item, fetched_at) for item in records)
            if len(records) < page_size:
                break
            page += 1
        return results[:target]

    def _map(self, item: dict, fetched_at: datetime) -> RawJob:
        location = self._location(item)
        title = item.get("title") or "Untitled"
        description = item.get("description")
        remote_text = " ".join(part for part in (title, location, description) if part).lower()
        category = (item.get("category") or {}).get("label")
        salary_raw = self._salary(item)
        return RawJob(
            source_name=self.source_name,
            external_id=str(item["id"]),
            source_url=item["redirect_url"],
            title=title,
            company_name=(item.get("company") or {}).get("display_name") or "Unknown",
            location_raw=location,
            description_raw=description,
            published_at=parse_datetime(item.get("created")),
            fetched_at=fetched_at,
            raw_payload=item,
            remote_hint="remote" in remote_text or "teletrabajo" in remote_text,
            salary_raw=salary_raw,
            tags=[
                value
                for value in (category, item.get("contract_type"), item.get("contract_time"))
                if value
            ],
        )

    def _location(self, item: dict) -> str | None:
        location = (item.get("location") or {}).get("display_name")
        if self.country != "es":
            return location
        if not location:
            return "Spain"
        if "spain" in location.lower() or "españa" in location.lower():
            return location
        return f"{location}, Spain"

    @staticmethod
    def _salary(item: dict) -> str | None:
        values = [item.get("salary_min"), item.get("salary_max")]
        amounts = [str(round(value)) for value in values if isinstance(value, int | float)]
        if not amounts:
            return None
        return f"EUR {'-'.join(amounts)} per year"
