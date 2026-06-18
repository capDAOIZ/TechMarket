import React, { useState } from "react";
import type { JobsQueryParams, Seniority, Modality, SourceName } from "../../shared/types/jobs";

type JobsFiltersProps = {
  params: JobsQueryParams;
  onChange: (params: JobsQueryParams) => void;
  onReset: () => void;
};

const SENIORITY_OPTIONS: { value: Seniority | ""; label: string }[] = [
  { value: "", label: "All levels" },
  { value: "intern", label: "Intern" },
  { value: "junior", label: "Junior" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead / Staff" },
  { value: "manager", label: "Manager" },
];

const MODALITY_OPTIONS: { value: Modality | ""; label: string }[] = [
  { value: "", label: "All modalities" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
];

const SOURCE_OPTIONS: { value: SourceName | ""; label: string }[] = [
  { value: "", label: "All sources" },
  { value: "remotive", label: "Remotive" },
  { value: "greenhouse", label: "Greenhouse" },
  { value: "arbeitnow", label: "Arbeitnow" },
];

const TECH_OPTIONS = [
  "", "Python", "JavaScript", "TypeScript", "React", "Node.js", "Java",
  "Spring", "FastAPI", "Django", "PostgreSQL", "MySQL", "AWS", "Azure",
  "GCP", "Docker", "Kubernetes", "Kafka", "Spark", "Airflow", "Terraform",
];

/* ── Shared input classes ─────────────────────────────────────────────────── */
const inputCls =
  "w-full px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-100 " +
  "placeholder-zinc-600 outline-none appearance-none " +
  "focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 " +
  "transition-colors duration-150";

const labelCls =
  "block text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-1";

/* ── Filter group ─────────────────────────────────────────────────────────── */
function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className={labelCls}>{label}</p>
      {children}
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────────────────────── */
export function JobsFilters({ params, onChange, onReset }: JobsFiltersProps) {
  const [open, setOpen] = useState(false);

  const set = (key: keyof JobsQueryParams, value: unknown) =>
    onChange({ ...params, [key]: value || undefined, page: 1 });

  const hasActiveFilters =
    !!(params.q || params.technology || params.seniority ||
       params.modality || params.source || params.remote);

  const filterBody = (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <FilterGroup label="Search">
        <input
          id="filter-q"
          type="text"
          className={inputCls}
          placeholder="Title, company, tech…"
          value={params.q ?? ""}
          onChange={(e) => set("q", e.target.value)}
        />
      </FilterGroup>

      {/* Technology */}
      <FilterGroup label="Technology">
        <select
          id="filter-technology"
          className={inputCls}
          value={params.technology ?? ""}
          onChange={(e) => set("technology", e.target.value)}
        >
          {TECH_OPTIONS.map((t) => (
            <option key={t} value={t} className="bg-zinc-800">
              {t || "All technologies"}
            </option>
          ))}
        </select>
      </FilterGroup>

      {/* Seniority */}
      <FilterGroup label="Seniority">
        <select
          id="filter-seniority"
          className={inputCls}
          value={params.seniority ?? ""}
          onChange={(e) => set("seniority", e.target.value as Seniority)}
        >
          {SENIORITY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value} className="bg-zinc-800">
              {o.label}
            </option>
          ))}
        </select>
      </FilterGroup>

      {/* Modality */}
      <FilterGroup label="Modality">
        <select
          id="filter-modality"
          className={inputCls}
          value={params.modality ?? ""}
          onChange={(e) => set("modality", e.target.value as Modality)}
        >
          {MODALITY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value} className="bg-zinc-800">
              {o.label}
            </option>
          ))}
        </select>
      </FilterGroup>

      {/* Source */}
      <FilterGroup label="Source">
        <select
          id="filter-source"
          className={inputCls}
          value={params.source ?? ""}
          onChange={(e) => set("source", e.target.value as SourceName)}
        >
          {SOURCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value} className="bg-zinc-800">
              {o.label}
            </option>
          ))}
        </select>
      </FilterGroup>

      {/* Remote toggle */}
      <FilterGroup label="Remote only">
        <button
          id="toggle-remote-track"
          type="button"
          role="switch"
          aria-checked={!!params.remote}
          onClick={() => set("remote", params.remote ? undefined : true)}
          className={[
            "relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200",
            params.remote ? "bg-indigo-600" : "bg-zinc-700",
          ].join(" ")}
        >
          <span
            className={[
              "inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200",
              params.remote ? "translate-x-4" : "translate-x-0.5",
            ].join(" ")}
          />
        </button>
      </FilterGroup>

      {/* Reset */}
      {hasActiveFilters && (
        <button
          onClick={onReset}
          className="w-full py-1.5 rounded-lg border border-zinc-700 text-xs font-medium text-zinc-400 
                     hover:border-zinc-500 hover:text-zinc-200 transition-colors duration-150"
        >
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* ── Mobile: collapsible trigger ─────────────────────────────────── */}
      <div className="md:hidden mb-4">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 w-full px-4 py-2.5 rounded-lg border border-zinc-700 
                     bg-zinc-900 text-sm font-medium text-zinc-200 
                     hover:border-zinc-600 transition-colors duration-150"
        >
          <FilterIcon className="w-4 h-4 text-zinc-400 shrink-0" />
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" />
          )}
          <ChevronIcon
            className={`ml-auto w-4 h-4 text-zinc-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>
        {open && (
          <div className="mt-2 p-4 rounded-lg border border-zinc-800 bg-zinc-900">
            {filterBody}
          </div>
        )}
      </div>

      {/* ── Desktop: sticky sidebar ──────────────────────────────────────── */}
      <aside className="hidden md:block sticky top-[calc(3.5rem+1rem)] self-start">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-zinc-100 flex items-center gap-1.5">
              <FilterIcon className="w-3.5 h-3.5 text-zinc-500" />
              Filters
            </span>
            {hasActiveFilters && (
              <button
                onClick={onReset}
                className="text-[10px] font-medium text-zinc-500 hover:text-zinc-200 transition-colors"
              >
                Reset
              </button>
            )}
          </div>
          {filterBody}
        </div>
      </aside>
    </>
  );
}

/* ── Inline icons ─────────────────────────────────────────────────────────── */
function FilterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}
