from pathlib import Path

from fastapi.testclient import TestClient
from scripts.pipeline import run_pipeline
from sqlalchemy.orm import Session


def seed_database(session: Session, tmp_path: Path) -> None:
    run_pipeline(session, [], seed=True, data_lake_root=tmp_path)


def test_jobs_pagination_filters_and_detail(
    client: TestClient, session: Session, tmp_path: Path
) -> None:
    seed_database(session, tmp_path)
    response = client.get("/jobs", params={"technology": "Python", "page_size": 2})
    assert response.status_code == 200
    body = response.json()
    assert body["page"] == 1
    assert body["page_size"] == 2
    assert body["total"] >= 2
    assert all("source_url" in item and "attribution" in item for item in body["items"])
    assert all("quality_score" in item and "salary_min" in item for item in body["items"])
    assert all("seniority_source" in item and "seniority_reason" in item for item in body["items"])

    job_id = body["items"][0]["id"]
    detail = client.get(f"/jobs/{job_id}")
    assert detail.status_code == 200
    assert detail.json()["description"] is not None
    assert client.get("/jobs/999999").status_code == 404


def test_stats_preserve_null_bucket(client: TestClient, session: Session, tmp_path: Path) -> None:
    seed_database(session, tmp_path)
    response = client.get("/stats/seniority")
    assert response.status_code == 200
    assert any(bucket["value"] is None for bucket in response.json())
    summary = client.get("/stats/summary").json()
    assert summary["total_jobs"] == 7
    assert summary["remote_percentage"] > 0
    assert summary["last_ingestion_at"] is not None
    assert client.get("/trends/technologies").status_code == 200
