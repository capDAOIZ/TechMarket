import logging
from datetime import UTC, datetime
from pathlib import Path

from connectors.adzuna import AdzunaConnector
from connectors.arbeitnow import ArbeitnowConnector
from connectors.base import BaseJobConnector
from connectors.greenhouse import GreenhouseConnector
from connectors.remotive import RemotiveConnector
from connectors.seed import SeedConnector
from quality.validators import validate_job
from schemas.raw_job import RawJob
from sqlalchemy import select
from sqlalchemy.orm import Session
from src.config import settings
from src.infrastructure.models import PipelineRunModel, PipelineSourceRunModel
from transformations.loader import (
    get_or_create_source,
    index_raw_job,
    mark_missing_jobs_inactive,
    rebuild_weekly_stats,
    retain_cross_source_duplicate_groups,
    upsert_job,
)
from transformations.normalization import normalize_job
from transformations.storage import write_curated, write_processed, write_raw

logger = logging.getLogger(__name__)

CONNECTOR_FACTORIES: dict[str, type[BaseJobConnector]] = {
    "adzuna": AdzunaConnector,
    "arbeitnow": ArbeitnowConnector,
    "remotive": RemotiveConnector,
    "greenhouse": GreenhouseConnector,
}


def run_pipeline(
    session: Session,
    sources: list[str],
    limit: int | None = None,
    seed: bool = False,
    data_lake_root: Path | None = None,
    connectors: dict[str, BaseJobConnector] | None = None,
) -> PipelineRunModel:
    root = data_lake_root or settings.data_lake_root
    requested = ["seed"] if seed else sources
    run = PipelineRunModel(status="running", requested_sources=requested)
    session.add(run)
    session.commit()
    try:
        active = (
            {"seed": SeedConnector()}
            if seed
            else {
                name: (connectors or {}).get(name) or CONNECTOR_FACTORIES[name]()
                for name in sources
            }
        )
        raw_jobs: list[RawJob] = []
        successful_snapshots: dict[str, list[RawJob]] = {}
        source_errors: list[str] = []
        for name, connector in active.items():
            logger.info("Fetching source %s", name)
            source_run = PipelineSourceRunModel(
                pipeline_run_id=run.id, source_name=name, status="running"
            )
            session.add(source_run)
            session.flush()
            try:
                fetched = connector.fetch(limit=limit)
                raw_jobs.extend(fetched)
                successful_snapshots[name] = fetched
                source_run.status = "success"
                source_run.fetched_count = len(fetched)
            except Exception as exc:
                logger.exception("Source %s failed", name)
                source_run.status = "failed"
                source_run.error_message = str(exc)[:4000]
                source_errors.append(f"{name}: {exc}")
            finally:
                source_run.finished_at = datetime.now(UTC)
                session.commit()

        if not successful_snapshots:
            run.status = "failed"
            run.finished_at = datetime.now(UTC)
            run.error_message = "; ".join(source_errors)[:4000]
            session.commit()
            return run

        raw_paths = write_raw(raw_jobs, root)
        run.fetched_count = len(raw_jobs)

        normalized = []
        for raw in raw_jobs:
            path = raw_paths[(raw.source_name, raw.external_id)]
            source = get_or_create_source(session, raw.source_name)
            index_raw_job(session, source, raw.as_dict(), path)
            job = normalize_job(raw, raw_path=path)
            if job is None:
                run.discarded_count += 1
                continue
            quality = validate_job(job)
            if not quality.valid:
                logger.warning("Discarding %s: %s", raw.external_id, quality.errors)
                run.discarded_count += 1
                continue
            normalized.append(job)

        write_processed(normalized, root, run.id)
        for job in normalized:
            upsert_job(session, job)
        if limit is None and not seed:
            observed_at = datetime.now(UTC)
            for name in successful_snapshots:
                mark_missing_jobs_inactive(
                    session,
                    name,
                    {job.external_id for job in normalized if job.source_name == name},
                    observed_at,
                )
        retain_cross_source_duplicate_groups(session)
        curated = rebuild_weekly_stats(session)
        write_curated(curated, root)
        run.loaded_count = len(normalized)
        run.status = "partial_success" if source_errors else "success"
        run.error_message = "; ".join(source_errors)[:4000] or None
        run.finished_at = datetime.now(UTC)
        session.commit()
        return run
    except Exception as exc:
        session.rollback()
        failed_run = session.scalar(select(PipelineRunModel).where(PipelineRunModel.id == run.id))
        if failed_run:
            failed_run.status = "failed"
            failed_run.finished_at = datetime.now(UTC)
            failed_run.error_message = str(exc)[:4000]
            session.commit()
        logger.exception("Pipeline run %s failed", run.id)
        raise
