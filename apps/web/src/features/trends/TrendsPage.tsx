import { useEffect, useState } from "react";
import { getTechnologyTrends } from "../../shared/api/stats.api";
import type { TechnologyTrendPoint } from "../../shared/types/stats";
import { TechnologyTrendChart } from "./TechnologyTrendChart";
import { LoadingState } from "../../shared/components/LoadingState";
import { ErrorState } from "../../shared/components/ErrorState";

const AVAILABLE_TECHS = ["Python", "TypeScript", "React", "Go", "Rust"];
const DEFAULT_SELECTED = ["Python", "TypeScript", "Go"];

const insights = [
  { label: "Fastest Growing", value: "Python & TypeScript", desc: "Consistent upward trend for 8 weeks" },
  { label: "Most In-demand",  value: "Python",             desc: "~310 jobs in the latest week" },
  { label: "Emerging",        value: "Rust",               desc: "+102% growth over 8 weeks" },
  { label: "Stable",          value: "React",              desc: "Flat trend, still high demand" },
];

export function TrendsPage() {
  const [data, setData] = useState<TechnologyTrendPoint[]>([]);
  const [selected, setSelected] = useState<string[]>(DEFAULT_SELECTED);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getTechnologyTrends();
      setData(res);
    } catch {
      setError("Failed to load trend data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleTech = (tech: string) =>
    setSelected((prev) =>
      prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech]
    );

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Technology Trends</h2>
        <p className="text-sm text-zinc-500 mt-0.5">
          Weekly job count evolution per technology — last 8 weeks
        </p>
      </div>

      {/* Chart card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-zinc-800">
          <span className="text-sm font-semibold text-zinc-100">Trend Analysis</span>
          {/* Tech selector chips */}
          <div className="flex flex-wrap gap-1.5">
            {AVAILABLE_TECHS.map((tech) => (
              <button
                key={tech}
                id={`trend-chip-${tech.toLowerCase()}`}
                onClick={() => toggleTech(tech)}
                className={[
                  "px-2.5 py-1 rounded-md text-xs font-medium border transition-colors duration-150",
                  selected.includes(tech)
                    ? "bg-indigo-600/20 border-indigo-500/40 text-indigo-300"
                    : "bg-transparent border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300",
                ].join(" ")}
              >
                {tech}
              </button>
            ))}
          </div>
        </div>
        <div className="px-4 py-4">
          {loading ? (
            <LoadingState text="Loading trends…" />
          ) : error ? (
            <ErrorState description={error} onRetry={load} />
          ) : (
            <TechnologyTrendChart data={data} selected={selected} />
          )}
        </div>
      </div>

      {/* Insights grid */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-zinc-800">
          <span className="text-sm font-semibold text-zinc-100">Insights</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 divide-x divide-y divide-zinc-800 border-zinc-800">
          {insights.map((ins) => (
            <div key={ins.label} className="px-5 py-4 hover:bg-zinc-800/40 transition-colors duration-150">
              <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest mb-1.5">
                {ins.label}
              </p>
              <p className="text-base font-bold text-indigo-400 mb-1">{ins.value}</p>
              <p className="text-xs text-zinc-600 leading-relaxed">{ins.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
