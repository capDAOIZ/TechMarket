import type { DashboardSummary } from "../../shared/types/stats";
import { format, parseISO } from "date-fns";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return n.toString();
}

type Stat = {
  label: string;
  value: React.ReactNode;
  sub: string;
};

export function SummaryCards({ summary }: { summary: DashboardSummary }) {
  const lastIngestion = summary.lastIngestionAt
    ? format(parseISO(summary.lastIngestionAt), "MMM d, HH:mm")
    : "Never";

  const stats: Stat[] = [
    { label: "Total Jobs",       value: formatNumber(summary.totalJobs),                          sub: "Active listings" },
    { label: "Companies",        value: formatNumber(summary.totalCompanies),                      sub: "Hiring now" },
    { label: "Sources",          value: summary.totalSources,                                      sub: "Job boards" },
    { label: "Remote",           value: `${summary.remotePercentage.toFixed(1)}%`,                sub: "Of all listings" },
    { label: "Salary Coverage",  value: `${summary.salaryCoveragePercentage.toFixed(1)}%`,        sub: "With salary info" },
    { label: "Last Ingestion",   value: lastIngestion,                                             sub: "Pipeline run" },
  ];

  return (
    <dl className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 divide-x divide-y divide-zinc-800 border border-zinc-800 rounded-xl overflow-hidden mb-8">
      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-col gap-1 bg-zinc-900 px-5 py-4 hover:bg-zinc-800/60 transition-colors duration-150">
          <dt className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest truncate">
            {stat.label}
          </dt>
          <dd className="text-2xl font-bold tracking-tight text-zinc-100 tabular-nums leading-none mt-1">
            {stat.value}
          </dd>
          <p className="text-[11px] text-zinc-600 mt-0.5">{stat.sub}</p>
        </div>
      ))}
    </dl>
  );
}

import React from "react";
