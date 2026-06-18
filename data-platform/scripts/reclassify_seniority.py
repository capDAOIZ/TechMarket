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
from transformations.normalization import classify_seniority  # noqa: E402


def update_processed_files(root: Path) -> tuple[int, int]:
    files = sorted((root / "processed" / "jobs").rglob("*.jsonl"))
    changed_records = 0
    for path in files:
        records = [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines()]
        file_changed = False
        for record in records:
            seniority = classify_seniority(record["title"])
            if record.get("seniority") != seniority:
                record["seniority"] = seniority
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
            seniority = classify_seniority(job.title)
            if job.seniority != seniority:
                job.seniority = seniority
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
