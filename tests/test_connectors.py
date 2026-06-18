import httpx
from connectors.arbeitnow import ArbeitnowConnector
from connectors.base import request_with_retry
from connectors.greenhouse import GreenhouseConnector
from connectors.remotive import RemotiveConnector
from src.config import settings


def mock_client(payload: dict) -> httpx.Client:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=payload, request=request)

    return httpx.Client(transport=httpx.MockTransport(handler))


def test_arbeitnow_mapping() -> None:
    payload = {
        "data": [
            {
                "slug": "python-engineer-1",
                "url": "https://arbeitnow.com/jobs/1",
                "title": "Python Engineer",
                "company_name": "Acme",
                "location": "Berlin",
                "description": "<p>Python</p>",
                "created_at": 1767348000,
                "remote": False,
                "tags": ["Python"],
            }
        ]
    }
    job = ArbeitnowConnector(mock_client(payload)).fetch()[0]
    assert job.source_name == "arbeitnow"
    assert job.external_id == "python-engineer-1"
    assert job.published_at.isoformat() == "2026-01-02T10:00:00+00:00"


def test_remotive_mapping_uses_explicit_salary() -> None:
    payload = {
        "jobs": [
            {
                "id": 42,
                "url": "https://remotive.com/job/42",
                "title": "Backend Engineer",
                "company_name": "Remote Co",
                "candidate_required_location": "Worldwide",
                "description": "Python APIs",
                "publication_date": "2026-01-02T10:00:00Z",
                "salary": "$100k-$130k",
                "category": "Software Development",
            }
        ]
    }
    job = RemotiveConnector(mock_client(payload)).fetch(limit=1)[0]
    assert job.external_id == "42"
    assert job.remote_hint is True
    assert job.salary_raw == "$100k-$130k"


def test_greenhouse_mapping_includes_board_in_external_id() -> None:
    payload = {
        "jobs": [
            {
                "id": 7,
                "absolute_url": "https://boards.greenhouse.io/stripe/jobs/7",
                "title": "Data Engineer",
                "location": {"name": "Remote - US"},
                "content": "Python and Spark",
                "updated_at": "2026-01-02T10:00:00Z",
                "departments": [{"name": "Engineering"}],
            }
        ]
    }
    job = GreenhouseConnector(mock_client(payload), boards=("stripe",)).fetch()[0]
    assert job.external_id == "stripe:7"
    assert job.company_name == "Stripe"
    assert job.remote_hint is True


def test_request_retries_transient_errors(monkeypatch) -> None:
    attempts = 0

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal attempts
        attempts += 1
        return httpx.Response(503 if attempts < 3 else 200, json={}, request=request)

    monkeypatch.setattr(settings, "external_request_backoff_seconds", 0)
    client = httpx.Client(transport=httpx.MockTransport(handler))
    response = request_with_retry(client, "https://example.com/jobs")
    assert response.status_code == 200
    assert attempts == 3
