import { useEffect, useState, useCallback } from "react";
import { getJobs } from "../../shared/api/jobs.api";
import type { PaginatedJobsResponse, JobsQueryParams } from "../../shared/types/jobs";
import { JobsFilters } from "./JobsFilters";
import { JobsTable } from "./JobsTable";
import { ErrorState } from "../../shared/components/ErrorState";

const DEFAULT_PARAMS: JobsQueryParams = { page: 1, page_size: 10 };

export function JobsPage() {
  const [params, setParams] = useState<JobsQueryParams>(DEFAULT_PARAMS);
  const [data, setData] = useState<PaginatedJobsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadJobs = useCallback(async (p: JobsQueryParams) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getJobs(p);
      setData(res);
    } catch {
      setError("Failed to load jobs. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadJobs(params); }, [params, loadJobs]);

  const handleParamsChange = (next: JobsQueryParams) => setParams(next);
  const handleReset = () => setParams(DEFAULT_PARAMS);
  const handlePageChange = (page: number) => setParams((p) => ({ ...p, page }));

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Job Listings</h2>
        <p className="text-sm text-zinc-500 mt-0.5">Browse and filter tech job opportunities</p>
      </div>

      {/* Desktop layout: sidebar + results */}
      <div className="md:grid md:grid-cols-[220px_1fr] md:gap-6 md:items-start">
        <div>
          <JobsFilters params={params} onChange={handleParamsChange} onReset={handleReset} />
        </div>

        {/* Results */}
        <div>
          {error ? (
            <ErrorState description={error} onRetry={() => loadJobs(params)} />
          ) : (
            <JobsTable data={data} loading={loading} onPageChange={handlePageChange} />
          )}
        </div>
      </div>
    </div>
  );
}
