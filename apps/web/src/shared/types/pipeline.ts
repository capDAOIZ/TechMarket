export type PipelineRun = {
  id: string;
  source: string;
  status: "success" | "failed" | "running";
  startedAt: string;
  finishedAt: string | null;
  rawJobsCount: number;
  processedJobsCount: number;
  insertedJobsCount: number;
  duplicateJobsCount: number;
  errorMessage: string | null;
};
