import json
from collections import defaultdict
from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4

from schemas.raw_job import RawJob
from src.domain.entities import NormalizedJob


def _json_default(value: object) -> str:
    if isinstance(value, datetime):
        return value.astimezone(UTC).isoformat()
    raise TypeError(f"Cannot serialize {type(value)!r}")


def write_raw(jobs: list[RawJob], root: Path) -> dict[tuple[str, str], str]:
    grouped: dict[str, list[RawJob]] = defaultdict(list)
    for job in jobs:
        grouped[job.source_name].append(job)
    paths: dict[tuple[str, str], str] = {}
    for source, source_jobs in grouped.items():
        ingestion_date = source_jobs[0].fetched_at.date().isoformat()
        directory = root / "raw" / f"source={source}" / f"ingestion_date={ingestion_date}"
        directory.mkdir(parents=True, exist_ok=True)
        stamp = datetime.now(UTC).strftime("%Y%m%dT%H%M%S%fZ")
        path = directory / f"{stamp}_{uuid4().hex}.json"
        path.write_text(
            json.dumps([job.as_dict() for job in source_jobs], ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        relative = path.relative_to(root).as_posix()
        for job in source_jobs:
            paths[(job.source_name, job.external_id)] = relative
    return paths


def write_processed(jobs: list[NormalizedJob], root: Path, run_id: int) -> Path:
    partition_date = datetime.now(UTC).date().isoformat()
    directory = root / "processed" / "jobs" / f"partition_date={partition_date}"
    directory.mkdir(parents=True, exist_ok=True)
    path = directory / f"pipeline_run={run_id}.jsonl"
    with path.open("w", encoding="utf-8") as handle:
        for job in jobs:
            handle.write(
                json.dumps(job.as_dict(), ensure_ascii=False, default=_json_default) + "\n"
            )
    return path


def write_curated(rows: list[dict], root: Path) -> Path:
    directory = root / "curated" / "weekly_technology_stats"
    directory.mkdir(parents=True, exist_ok=True)
    path = directory / "latest.jsonl"
    with path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False, default=_json_default) + "\n")
    return path
