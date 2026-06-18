import { useEffect, useState } from "react";
import { getPipelineRuns } from "../../shared/api/pipeline.api";
import type { PipelineRun } from "../../shared/types/pipeline";
import { PipelineRunsTable } from "./PipelineRunsTable";
import { LoadingState } from "../../shared/components/LoadingState";
import { ErrorState } from "../../shared/components/ErrorState";

export function PipelineRunsPage() {
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPipelineRuns();
      setRuns(data);
    } catch {
      setError("Failed to load pipeline runs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const success  = runs.filter((r) => r.status === "success").length;
  const failed   = runs.filter((r) => r.status === "failed").length;
  const running  = runs.filter((r) => r.status === "running").length;
  const inserted = runs.reduce((acc, r) => acc + r.insertedJobsCount, 0);

  const kpis = [
    { label: "Total Runs",    value: runs.length,                  color: "text-zinc-100" },
    { label: "Successful",    value: success,                       color: "text-emerald-400" },
    { label: "Failed",        value: failed,                        color: "text-red-400" },
    { label: "Running",       value: running,                       color: "text-sky-400" },
    { label: "Jobs Inserted", value: inserted.toLocaleString(),     color: "text-indigo-400" },
  ];

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Pipeline Runs</h2>
          <p className="text-sm text-zinc-500 mt-0.5">Monitor ingestion jobs across all sources</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-700 text-xs font-medium text-zinc-400
                     hover:border-zinc-600 hover:text-zinc-200 transition-colors duration-150"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Refresh
        </button>
      </div>

      {/* KPI strip */}
      {!loading && !error && (
        <dl className="grid grid-cols-2 sm:grid-cols-5 divide-x divide-y divide-zinc-800 border border-zinc-800 rounded-xl overflow-hidden mb-4">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="flex flex-col gap-1 bg-zinc-900 px-4 py-3 hover:bg-zinc-800/60 transition-colors duration-150">
              <dt className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">{kpi.label}</dt>
              <dd className={`text-xl font-bold tabular-nums leading-none mt-0.5 ${kpi.color}`}>{kpi.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {/* Run history table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800">
          <span className="text-sm font-semibold text-zinc-100">Run History</span>
          <span className="text-xs text-zinc-600">{runs.length} runs</span>
        </div>
        {loading ? (
          <div className="p-6">
            <LoadingState text="Loading pipeline runs…" />
          </div>
        ) : error ? (
          <div className="p-6">
            <ErrorState description={error} onRetry={load} />
          </div>
        ) : (
          <PipelineRunsTable runs={runs} />
        )}
      </div>
    </div>
  );
}
