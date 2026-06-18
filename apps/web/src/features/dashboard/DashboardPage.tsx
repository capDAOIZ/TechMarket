import { useEffect, useState } from "react";
import { getSummary, getTechnologies, getSeniority, getModalities } from "../../shared/api/stats.api";
import type { DashboardSummary, TechnologyStat, BucketStat } from "../../shared/types/stats";
import { SummaryCards } from "./SummaryCards";
import { TopTechnologiesChart } from "./TopTechnologiesChart";
import { ModalityChart } from "./ModalityChart";
import { SeniorityChart } from "./SeniorityChart";
import { LoadingState } from "../../shared/components/LoadingState";
import { ErrorState } from "../../shared/components/ErrorState";

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [technologies, setTechnologies] = useState<TechnologyStat[]>([]);
  const [seniority, setSeniority] = useState<BucketStat[]>([]);
  const [modalities, setModalities] = useState<BucketStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, t, sen, mod] = await Promise.all([
        getSummary(),
        getTechnologies(),
        getSeniority(),
        getModalities(),
      ]);
      setSummary(s);
      setTechnologies(t);
      setSeniority(sen);
      setModalities(mod);
    } catch {
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  if (loading) return <LoadingState text="Loading dashboard…" />;
  if (error) return <ErrorState description={error} onRetry={loadAll} />;

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Market Overview</h2>
        <p className="text-sm text-zinc-500 mt-0.5">
          Real-time tech job intelligence across all sources
        </p>
      </div>

      {/* KPI row */}
      {summary && <SummaryCards summary={summary} />}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top technologies — 2/3 width */}
        <div className="lg:col-span-2">
          <TopTechnologiesChart data={technologies.slice(0, 10)} />
        </div>
        {/* Modality — 1/3 width */}
        <div>
          <ModalityChart data={modalities} />
        </div>
        {/* Seniority — full width */}
        <div className="lg:col-span-3">
          <SeniorityChart data={seniority} />
        </div>
      </div>
    </div>
  );
}
