import json
import sys
from pathlib import Path

from sqlalchemy import select

PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(PROJECT_ROOT / "apps" / "api"))
sys.path.insert(0, str(PROJECT_ROOT / "data-platform"))

from src.config import settings  # noqa: E402
from src.infrastructure.database import SessionLocal  # noqa: E402
from src.infrastructure.models import JobModel  # noqa: E402
from transformations.normalization import classify_seniority_details  # noqa: E402


def classification_values(title: str, description: str | None) -> dict[str, object]:
    result = classify_seniority_details(title, description)
    return {
        "seniority": result.level,
        "experience_min_years": result.experience_min_years,
        "experience_max_years": result.experience_max_years,
        "seniority_source": result.source,
        "seniority_confidence": result.confidence,
        "seniority_reason": result.reason,
    }


def update_processed_files(root: Path) -> tuple[int, int]:
    files = sorted((root / "processed" / "jobs").rglob("*.jsonl"))
    changed_records = 0
    for path in files:
        records = [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines()]
        file_changed = False
        for record in records:
            values = classification_values(record["title"], record.get("description"))
            if any(record.get(key) != value for key, value in values.items()):
                record.update(values)
                changed_records += 1
                file_changed = True
        if file_changed:
            replacement = path.with_suffix(".jsonl.tmp")
            replacement.write_text(
                "".join(json.dumps(record, ensure_ascii=False) + "\n" for record in records),
                encoding="utf-8",
            )
            replacement.replace(path)
    return len(files), changed_records


def main() -> int:
    changed_jobs = 0
    with SessionLocal() as session:
        for job in session.scalars(select(JobModel)):
            values = classification_values(job.title, job.description)
            if any(getattr(job, key) != value for key, value in values.items()):
                for key, value in values.items():
                    setattr(job, key, value)
                changed_jobs += 1
        session.commit()

    files, changed_records = update_processed_files(settings.data_lake_root)
    print(
        f"database_jobs_updated={changed_jobs} processed_files={files} "
        f"processed_records_updated={changed_records}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
