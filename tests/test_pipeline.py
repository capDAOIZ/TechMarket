from pathlib import Path

from connectors.base import BaseJobConnector
from scripts.pipeline import run_pipeline
from sqlalchemy import select
from sqlalchemy.orm import Session
from src.infrastructure.models import PipelineRunModel


class FailingConnector(BaseJobConnector):
    source_name = "arbeitnow"

    def fetch(self, limit: int | None = None) -> list:
        raise RuntimeError("upstream unavailable")


class EmptyConnector(BaseJobConnector):
    source_name = "remotive"

    def fetch(self, limit: int | None = None) -> list:
        return []


def test_successful_pipeline_is_registered(session: Session, tmp_path: Path) -> None:
    run = run_pipeline(session, [], seed=True, data_lake_root=tmp_path)
    assert run.status == "success"
    assert run.fetched_count == 8
    assert run.loaded_count == 7
    assert run.discarded_count == 1
    assert list((tmp_path / "raw").rglob("*.json"))
    assert list((tmp_path / "processed").rglob("*.jsonl"))
    assert (tmp_path / "curated" / "weekly_technology_stats" / "latest.jsonl").exists()


def test_failed_pipeline_is_registered(session: Session, tmp_path: Path) -> None:
    run_pipeline(
        session,
        ["arbeitnow"],
        data_lake_root=tmp_path,
        connectors={"arbeitnow": FailingConnector()},
    )
    run = session.scalar(select(PipelineRunModel))
    assert run is not None
    assert run.status == "failed"
    assert run.finished_at is not None
    assert "upstream unavailable" in (run.error_message or "")
    assert run.source_runs[0].source_name == "arbeitnow"
    assert run.source_runs[0].status == "failed"


def test_source_failure_is_isolated(session: Session, tmp_path: Path) -> None:
    run = run_pipeline(
        session,
        ["arbeitnow", "remotive"],
        data_lake_root=tmp_path,
        connectors={"arbeitnow": FailingConnector(), "remotive": EmptyConnector()},
    )
    assert run.status == "partial_success"
    assert {source.status for source in run.source_runs} == {"failed", "success"}
