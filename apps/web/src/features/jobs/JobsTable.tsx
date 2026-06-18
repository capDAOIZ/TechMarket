import type { PaginatedJobsResponse } from "../../shared/types/jobs";
import type { JobListItem } from "../../shared/types/jobs";
import { JobCard } from "./JobCard";
import { EmptyState } from "../../shared/components/EmptyState";
import { SkeletonCard } from "../../shared/components/LoadingState";

type JobsTableProps = {
  data: PaginatedJobsResponse | null;
  loading: boolean;
  onPageChange: (page: number) => void;
};

const pageBtnBase =
  "min-w-[32px] h-8 flex items-center justify-center rounded-md text-xs font-medium border " +
  "border-zinc-700 bg-zinc-900 text-zinc-400 cursor-pointer " +
  "hover:border-zinc-600 hover:text-zinc-100 transition-colors duration-150 " +
  "disabled:opacity-30 disabled:cursor-not-allowed px-2";

const pageBtnActive = "bg-indigo-600 border-indigo-600 text-white hover:border-indigo-500";

export function JobsTable({ data, loading, onPageChange }: JobsTableProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <EmptyState
        title="No jobs found"
        description="Try adjusting your filters or search to find more opportunities."
      />
    );
  }

  const { items, page, totalPages, total, pageSize } = data;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div>
      {/* Results count */}
      <p className="text-xs text-zinc-600 mb-3">
        Showing{" "}
        <span className="text-zinc-300 font-medium">{start}–{end}</span> of{" "}
        <span className="text-zinc-300 font-medium">{total.toLocaleString()}</span> jobs
      </p>

      {/* Card grid */}
      <div className="grid grid-cols-1 gap-3">
        {items.map((job: JobListItem) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-8">
          <button
            className={pageBtnBase}
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Previous page"
          >
            ‹
          </button>

          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            let p: number;
            if (totalPages <= 7) p = i + 1;
            else if (page <= 4) p = i + 1;
            else if (page >= totalPages - 3) p = totalPages - 6 + i;
            else p = page - 3 + i;
            return (
              <button
                key={p}
                className={[pageBtnBase, p === page ? pageBtnActive : ""].join(" ")}
                onClick={() => onPageChange(p)}
                aria-current={p === page ? "page" : undefined}
              >
                {p}
              </button>
            );
          })}

          <button
            className={pageBtnBase}
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next page"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
