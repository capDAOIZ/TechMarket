import argparse
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(PROJECT_ROOT / "apps" / "api"))
sys.path.insert(0, str(PROJECT_ROOT / "data-platform"))

from src.config import settings  # noqa: E402
from src.infrastructure.database import SessionLocal  # noqa: E402
from transformations.loader import (  # noqa: E402
    load_processed_file,
    rebuild_weekly_stats,
    retain_cross_source_duplicate_groups,
)
from transformations.storage import write_curated  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description="Rebuild PostgreSQL from processed JSONL files")
    parser.add_argument("--data-lake-root", type=Path, default=settings.data_lake_root)
    args = parser.parse_args()
    files = sorted((args.data_lake_root / "processed" / "jobs").rglob("*.jsonl"))
    loaded = 0
    with SessionLocal() as session:
        for path in files:
            loaded += load_processed_file(session, path)
        retain_cross_source_duplicate_groups(session)
        curated = rebuild_weekly_stats(session)
        session.commit()
    write_curated(curated, args.data_lake_root)
    print(f"processed_files={len(files)} loaded_records={loaded}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
