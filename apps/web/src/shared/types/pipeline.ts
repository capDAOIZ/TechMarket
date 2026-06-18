export type PipelineRun = {
  id: string;
  sources: string[];
  status: "success" | "partial_success" | "failed" | "running";
  startedAt: string;
  finishedAt: string | null;
  fetchedCount: number;
  loadedCount: number;
  discardedCount: number;
  errorMessage: string | null;
};
