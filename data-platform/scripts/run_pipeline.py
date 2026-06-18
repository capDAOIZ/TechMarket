import argparse
import logging
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(PROJECT_ROOT / "apps" / "api"))
sys.path.insert(0, str(PROJECT_ROOT / "data-platform"))

from src.infrastructure.database import SessionLocal  # noqa: E402

from scripts.pipeline import CONNECTOR_FACTORIES, run_pipeline  # noqa: E402


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the TechJobs Radar ingestion pipeline")
    parser.add_argument("--seed", action="store_true", help="Load deterministic demo data")
    parser.add_argument(
        "--sources",
        nargs="+",
        choices=sorted(CONNECTOR_FACTORIES),
        default=list(CONNECTOR_FACTORIES),
    )
    parser.add_argument("--limit", type=int, default=None, help="Maximum jobs per connector")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    with SessionLocal() as session:
        run = run_pipeline(session, args.sources, args.limit, seed=args.seed)
    print(
        f"pipeline_run={run.id} status={run.status} fetched={run.fetched_count} "
        f"loaded={run.loaded_count} discarded={run.discarded_count}"
    )
    return 1 if run.status == "failed" else 0


if __name__ == "__main__":
    raise SystemExit(main())
