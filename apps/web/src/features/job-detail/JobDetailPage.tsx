import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getJobById } from "../../shared/api/jobs.api";
import type { JobDetail } from "../../shared/types/jobs";
import { LoadingState } from "../../shared/components/LoadingState";
import { ErrorState } from "../../shared/components/ErrorState";
import { format, parseISO } from "date-fns";

function formatSalary(salary: JobDetail["salary"]): string {
  if (!salary.min && !salary.max) return "Not disclosed";
  const cur = salary.currency ?? "";
  const period =
    salary.period === "year" ? "/year"
    : salary.period === "month" ? "/month"
    : salary.period === "hour" ? "/hour"
    : "";
  if (salary.min && salary.max)
    return `${cur} ${salary.min.toLocaleString()} – ${salary.max.toLocaleString()}${period}`;
  if (salary.min) return `${cur} ${salary.min.toLocaleString()}${period}+`;
  if (salary.max) return `Up to ${cur} ${salary.max.toLocaleString()}${period}`;
  return "Not disclosed";
}

const seniorityLabel: Record<string, string> = {
  intern: "Intern", junior: "Junior", mid: "Mid-level",
  senior: "Senior", lead: "Lead / Staff", unknown: "Not specified",
};

const modalityLabel: Record<string, string> = {
  remote: "Remote", hybrid: "Hybrid", onsite: "On-site", unknown: "Not specified",
};

/* ── Shared meta item ─────────────────────────────────────────────────────── */
function MetaItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
        {label}
      </span>
      <span className="text-sm font-medium text-zinc-100">{children}</span>
    </div>
  );
}

export function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    getJobById(id)
      .then(setJob)
      .catch(() => setError("Job not found or failed to load."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingState text="Loading job…" />;
  if (error || !job) return <ErrorState description={error ?? "Job not found."} onRetry={() => navigate(-1)} />;

  const logoLetter = job.company.name.charAt(0).toUpperCase();
  const hasSalary = !!(job.salary.min || job.salary.max);

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* ── Top nav bar ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-200 transition-colors duration-150"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Jobs
        </button>
        <a
          href={job.source.url}
          target="_blank"
          rel="noopener noreferrer"
          id="apply-btn"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold
                     hover:bg-indigo-500 transition-colors duration-150"
        >
          View on {job.source.attribution}
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </a>
      </div>

      {/* ── Hero card ────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        {/* Company + title */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-14 h-14 rounded-xl border border-zinc-700 bg-zinc-800 flex items-center justify-center shrink-0 overflow-hidden">
            {job.company.logoUrl && !imgError ? (
              <img
                src={job.company.logoUrl}
                alt={job.company.name}
                className="w-full h-full object-contain"
                onError={() => setImgError(true)}
              />
            ) : (
              <span className="text-lg font-bold text-zinc-400 select-none">{logoLetter}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-zinc-100 tracking-tight leading-snug">{job.title}</h2>
            <p className="text-sm text-zinc-500 mt-0.5">{job.company.name}</p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-widest">
                {job.source.name}
              </span>
              {job.location.remote && (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ring-1 bg-emerald-500/10 text-emerald-400 ring-emerald-500/20">
                  Remote
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5 border-t border-zinc-800">
          <MetaItem label="Location">{job.location.label}</MetaItem>
          <MetaItem label="Modality">{modalityLabel[job.modality] ?? job.modality}</MetaItem>
          <MetaItem label="Seniority">{seniorityLabel[job.seniority] ?? job.seniority}</MetaItem>
          <MetaItem label="Role">{job.role ?? "Not specified"}</MetaItem>
          <MetaItem label="Salary">
            <span className={hasSalary ? "text-emerald-400" : "text-zinc-600"}>
              {formatSalary(job.salary)}
            </span>
          </MetaItem>
          <MetaItem label="Published">
            {job.publishedAt ? format(parseISO(job.publishedAt), "MMM d, yyyy") : "Unknown"}
          </MetaItem>
          <MetaItem label="Quality">
            <span className="text-indigo-400">{(job.qualityScore * 100).toFixed(0)} / 100</span>
          </MetaItem>
          <MetaItem label="Ingested">
            {format(parseISO(job.ingestedAt), "MMM d, HH:mm")}
          </MetaItem>
        </div>

        {/* Technologies */}
        {job.technologies.length > 0 && (
          <div className="mt-5 pt-5 border-t border-zinc-800">
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2.5">
              Technologies
            </p>
            <div className="flex flex-wrap gap-1.5">
              {job.technologies.map((t: string) => (
                <span
                  key={t}
                  className="px-2 py-1 rounded-md text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Description ──────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        <div className="flex items-center px-6 py-4 border-b border-zinc-800">
          <span className="text-sm font-semibold text-zinc-100">Job Description</span>
        </div>
        <div className="px-6 py-5">
          {job.descriptionHtml ? (
            <div
              className="text-sm leading-relaxed text-zinc-400 prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: job.descriptionHtml }}
            />
          ) : (
            <pre className="text-sm leading-relaxed text-zinc-400 whitespace-pre-wrap font-sans">
              {job.descriptionClean}
            </pre>
          )}
        </div>
      </div>

      {/* ── Source attribution ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 px-5 py-4">
        <div>
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-semibold mb-1">
            Source Attribution
          </p>
          <p className="text-xs text-zinc-500">
            Listed on{" "}
            <span className="text-zinc-300 font-medium">{job.source.attribution}</span>
            {" · "}
            External ID:{" "}
            <code className="text-indigo-400 text-[11px]">{job.externalId}</code>
          </p>
        </div>
        <a
          href={job.source.url}
          target="_blank"
          rel="noopener noreferrer"
          id="apply-btn-footer"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-zinc-700 text-xs font-medium text-zinc-300
                     hover:border-indigo-500 hover:text-indigo-300 transition-colors duration-150 whitespace-nowrap"
        >
          Apply / View Original →
        </a>
      </div>
    </div>
  );
}

import React from "react";
