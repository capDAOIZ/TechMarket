import React from "react";
import { useNavigate } from "react-router-dom";
import type { JobListItem } from "../../shared/types/jobs";
import { formatDistanceToNow, parseISO } from "date-fns";

/* ── Salary formatter ─────────────────────────────────────────────────────── */
function formatSalary(salary: JobListItem["salary"]): string | null {
  if (!salary.min && !salary.max) return null;
  const cur = salary.currency ?? "";
  const period =
    salary.period === "year" ? "/yr"
    : salary.period === "month" ? "/mo"
    : salary.period === "hour" ? "/hr"
    : "";
  if (salary.min && salary.max) {
    return `${cur} ${(salary.min / 1000).toFixed(0)}k–${(salary.max / 1000).toFixed(0)}k${period}`;
  }
  if (salary.min) return `${cur} ${salary.min.toLocaleString()}${period}+`;
  if (salary.max) return `Up to ${cur} ${salary.max.toLocaleString()}${period}`;
  return null;
}

/* ── Seniority pill ───────────────────────────────────────────────────────── */
const SENIORITY_STYLE: Record<string, string> = {
  lead:    "bg-violet-500/10 text-violet-400 ring-violet-500/20",
  senior:  "bg-indigo-500/10 text-indigo-400 ring-indigo-500/20",
  mid:     "bg-sky-500/10    text-sky-400    ring-sky-500/20",
  junior:  "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
  intern:  "bg-amber-500/10  text-amber-400  ring-amber-500/20",
  unknown: "bg-zinc-500/10   text-zinc-500   ring-zinc-500/20",
};

function SeniorityPill({ s }: { s: JobListItem["seniority"] }) {
  const cls = SENIORITY_STYLE[s] ?? SENIORITY_STYLE.unknown;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ring-1 ${cls}`}>
      {s}
    </span>
  );
}

/* ── Modality pill ────────────────────────────────────────────────────────── */
const MODALITY_STYLE: Record<string, string> = {
  remote:  "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
  hybrid:  "bg-cyan-500/10    text-cyan-400    ring-cyan-500/20",
  onsite:  "bg-zinc-500/10    text-zinc-400    ring-zinc-500/20",
  unknown: "bg-zinc-500/10    text-zinc-500    ring-zinc-500/20",
};

function ModalityPill({ m }: { m: JobListItem["modality"] }) {
  const cls = MODALITY_STYLE[m] ?? MODALITY_STYLE.unknown;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ring-1 ${cls}`}>
      {m}
    </span>
  );
}

/* ── Source dot ───────────────────────────────────────────────────────────── */
const SOURCE_COLOR: Record<string, string> = {
  remotive:   "text-indigo-400",
  greenhouse: "text-emerald-400",
  arbeitnow:  "text-amber-400",
  adzuna:     "text-rose-400",
};

/* ── Main component ───────────────────────────────────────────────────────── */
export function JobCard({ job }: { job: JobListItem }) {
  const navigate = useNavigate();
  const [imgError, setImgError] = React.useState(false);
  const salaryStr = formatSalary(job.salary);

  const publishedLabel = job.publishedAt
    ? formatDistanceToNow(parseISO(job.publishedAt), { addSuffix: true })
    : "Date unknown";

  const logoLetter = job.company.name.charAt(0).toUpperCase();
  const sourceColor = SOURCE_COLOR[job.source.name] ?? "text-zinc-500";

  return (
    <article
      className="group relative flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4 cursor-pointer
                 hover:border-zinc-700 hover:bg-zinc-800/40 transition-all duration-200 outline-none
                 focus-visible:ring-2 focus-visible:ring-indigo-500"
      onClick={() => navigate(`/jobs/${job.id}`)}
      onKeyDown={(e) => e.key === "Enter" && navigate(`/jobs/${job.id}`)}
      role="button"
      tabIndex={0}
      aria-label={`${job.title} at ${job.company.name}`}
    >
      {/* ── Header ── */}
      <div className="flex items-start gap-3">
        {/* Logo */}
        <div className="w-9 h-9 rounded-lg border border-zinc-700 bg-zinc-800 flex items-center justify-center shrink-0 overflow-hidden">
          {job.company.logoUrl && !imgError ? (
            <img
              src={job.company.logoUrl}
              alt={job.company.name}
              className="w-full h-full object-contain"
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="text-sm font-bold text-zinc-400 select-none">{logoLetter}</span>
          )}
        </div>

        {/* Title + company */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-zinc-100 leading-snug truncate group-hover:text-white transition-colors">
            {job.title}
          </p>
          <p className="text-xs text-zinc-500 mt-0.5 truncate">{job.company.name}</p>
        </div>

        {/* Salary (top-right) */}
        {salaryStr && (
          <span className="shrink-0 text-xs font-semibold text-emerald-400 tabular-nums">
            {salaryStr}
          </span>
        )}
      </div>

      {/* ── Pills row ── */}
      <div className="flex flex-wrap items-center gap-1.5">
        <SeniorityPill s={job.seniority} />
        <ModalityPill m={job.modality} />
        {job.location.city && (
          <span className="text-[11px] text-zinc-500">
            {job.location.city}
            {job.location.country ? `, ${job.location.country}` : ""}
          </span>
        )}
        {!job.location.city && job.location.remote && (
          <span className="text-[11px] text-zinc-500">{job.location.label}</span>
        )}
      </div>

      {/* ── Tech chips ── */}
      {job.technologies.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {job.technologies.slice(0, 5).map((t: string) => (
            <span
              key={t}
              className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700/60 
                         group-hover:border-zinc-600 transition-colors"
            >
              {t}
            </span>
          ))}
          {job.technologies.length > 5 && (
            <span className="px-1.5 py-0.5 rounded text-[10px] text-zinc-600 bg-zinc-800 border border-zinc-700/60">
              +{job.technologies.length - 5}
            </span>
          )}
        </div>
      )}

      {/* ── Footer ── */}
      <div className="flex items-center justify-between pt-2.5 border-t border-zinc-800/80">
        <span className={`text-[11px] font-medium ${sourceColor}`}>
          {job.source.name}
        </span>
        <span className="text-[11px] text-zinc-600">{publishedLabel}</span>
      </div>
    </article>
  );
}
