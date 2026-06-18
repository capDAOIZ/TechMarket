import type { PipelineRun } from "../types/pipeline";
import { mockPipelineRuns } from "../mock/pipeline.mock";

const USE_MOCK = !import.meta.env.VITE_API_URL;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getPipelineRuns(): Promise<PipelineRun[]> {
  if (USE_MOCK) { await delay(350); return mockPipelineRuns; }
  const { apiFetch } = await import("./client");
  return apiFetch<PipelineRun[]>("/pipeline-runs");
}
