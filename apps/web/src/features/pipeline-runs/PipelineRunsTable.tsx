import type { PipelineRun } from "../../shared/types/pipeline";
import { format, parseISO, formatDistanceToNow } from "date-fns";

/* ── Status badge ─────────────────────────────────────────────────────────── */
const STATUS_CLS: Record<PipelineRun["status"], string> = {
  success: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
  partial_success: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
  failed:  "bg-red-500/10    text-red-400    ring-red-500/20",
  running: "bg-sky-500/10    text-sky-400    ring-sky-500/20",
};

const STATUS_LABEL: Record<PipelineRun["status"], string> = {
  success: "Success",
  partial_success: "Partial",
  failed:  "Failed",
  running: "Running",
};

function StatusBadge({ status }: { status: PipelineRun["status"] }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ring-1 ${STATUS_CLS[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function duration(start: string, end: string | null): string {
  if (!end) return "In progress…";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return m === 0 ? `${s}s` : `${m}m ${s % 60}s`;
}

/* ── Column header ────────────────────────────────────────────────────────── */
function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-[10px] font-semibold text-zinc-500 uppercase tracking-widest bg-zinc-900/80">
      {children}
    </th>
  );
}

/* ── Table cell ───────────────────────────────────────────────────────────── */
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`px-4 py-3 text-xs text-zinc-400 border-t border-zinc-800 ${className}`}>
      {children}
    </td>
  );
}

/* ── Source dot ───────────────────────────────────────────────────────────── */
const SOURCE_COLOR: Record<string, string> = {
  remotive:   "text-indigo-400",
  greenhouse: "text-emerald-400",
  arbeitnow:  "text-amber-400",
  adzuna:     "text-rose-400",
};

export function PipelineRunsTable({ runs }: { runs: PipelineRun[] }) {
  if (runs.length === 0) {
    return (
      <p className="text-center text-sm text-zinc-600 py-12">No pipeline runs found.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr>
            <Th>Run ID</Th>
            <Th>Sources</Th>
            <Th>Status</Th>
            <Th>Started</Th>
            <Th>Duration</Th>
            <Th>Fetched</Th>
            <Th>Loaded</Th>
            <Th>Discarded</Th>
            <Th>Error</Th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => (
            <tr key={run.id} className="group hover:bg-zinc-800/30 transition-colors duration-100">
              <Td>
                <code className="text-[10px] text-indigo-400/80">{run.id.slice(0, 8)}…</code>
              </Td>
              <Td>
                <span className={`text-xs font-medium ${SOURCE_COLOR[run.sources[0]] ?? "text-zinc-400"}`}>
                  {run.sources.join(", ")}
                </span>
              </Td>
              <Td>
                <StatusBadge status={run.status} />
              </Td>
              <Td>
                <span
                  title={format(parseISO(run.startedAt), "yyyy-MM-dd HH:mm:ss")}
                  className="cursor-default"
                >
                  {formatDistanceToNow(parseISO(run.startedAt), { addSuffix: true })}
                </span>
              </Td>
              <Td className="tabular-nums">{duration(run.startedAt, run.finishedAt)}</Td>
              <Td className="tabular-nums font-semibold text-zinc-200">
                {run.fetchedCount.toLocaleString()}
              </Td>
              <Td className="tabular-nums font-semibold text-emerald-400">
                {run.loadedCount.toLocaleString()}
              </Td>
              <Td className="tabular-nums text-amber-400">
                {run.discardedCount.toLocaleString()}
              </Td>
              <Td>
                {run.errorMessage ? (
                  <span
                    className="block max-w-[180px] truncate text-red-400 text-[11px] cursor-default"
                    title={run.errorMessage}
                  >
                    {run.errorMessage}
                  </span>
                ) : (
                  <span className="text-zinc-700">—</span>
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import React from "react";
