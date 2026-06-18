/* ── Full-page spinner ────────────────────────────────────────────────────── */
export function LoadingState({ text = "Loading…" }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[320px] gap-4">
      <div className="relative w-8 h-8">
        <div className="absolute inset-0 rounded-full border-2 border-zinc-700" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-500 animate-spin" />
      </div>
      <p className="text-sm text-zinc-500">{text}</p>
    </div>
  );
}

/* ── Skeleton card — mirrors JobCard structure ────────────────────────────── */
export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 flex flex-col gap-3 animate-pulse">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-zinc-800 shrink-0" />
        <div className="flex-1 space-y-2 pt-0.5">
          <div className="h-3.5 bg-zinc-800 rounded-md w-3/5" />
          <div className="h-2.5 bg-zinc-800 rounded-md w-2/5" />
        </div>
        <div className="h-3 bg-zinc-800 rounded-md w-16 shrink-0" />
      </div>
      {/* Pills */}
      <div className="flex items-center gap-1.5">
        <div className="h-4 bg-zinc-800 rounded w-14" />
        <div className="h-4 bg-zinc-800 rounded w-14" />
        <div className="h-3 bg-zinc-800 rounded w-20" />
      </div>
      {/* Tech chips */}
      <div className="flex gap-1">
        {[40, 52, 36, 44, 48].map((w) => (
          <div key={w} style={{ width: w }} className="h-4 bg-zinc-800 rounded" />
        ))}
      </div>
      {/* Footer */}
      <div className="border-t border-zinc-800 pt-2.5 flex items-center justify-between">
        <div className="h-2.5 bg-zinc-800 rounded w-16" />
        <div className="h-2.5 bg-zinc-800 rounded w-24" />
      </div>
    </div>
  );
}
