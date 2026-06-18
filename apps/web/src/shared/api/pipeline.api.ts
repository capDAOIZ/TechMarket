import { mockPipelineRuns } from "../mock/pipeline.mock";
import type { PipelineRun } from "../types/pipeline";
import { apiFetch } from "./client";
import type { ApiPipelineRun } from "./contracts";

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

export async function getPipelineRuns(): Promise<PipelineRun[]> {
  if (USE_MOCKS) {
    return mockPipelineRuns.map((run) => ({
      id: run.id,
      sources: [run.source],
      status: run.status,
      startedAt: run.startedAt,
      finishedAt: run.finishedAt,
      fetchedCount: run.rawJobsCount,
      loadedCount: run.insertedJobsCount,
      discardedCount: Math.max(0, run.rawJobsCount - run.processedJobsCount),
      errorMessage: run.errorMessage,
    }));
  }
  const rows = await apiFetch<ApiPipelineRun[]>("/pipeline-runs");
  return rows.map((run) => ({
    id: String(run.id),
    sources: run.requested_sources,
    status: run.status,
    startedAt: run.started_at,
    finishedAt: run.finished_at,
    fetchedCount: run.fetched_count,
    loadedCount: run.loaded_count,
    discardedCount: run.discarded_count,
    errorMessage: run.error_message,
  }));
}
