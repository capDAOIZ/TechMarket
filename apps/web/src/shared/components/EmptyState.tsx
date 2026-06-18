type EmptyStateProps = {
  title?: string;
  description?: string;
  icon?: string;
  action?: React.ReactNode;
};

export function EmptyState({
  title = "No results found",
  description = "Try adjusting your filters or search query.",
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[280px] gap-3 py-12 text-center px-6">
      <div className="w-10 h-10 rounded-full border border-zinc-700 bg-zinc-800 flex items-center justify-center mb-1">
        <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803M10.5 7.5v6m3-3h-6" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-zinc-300">{title}</p>
      <p className="text-xs text-zinc-600 max-w-xs leading-relaxed">{description}</p>
      {action}
    </div>
  );
}

import React from "react";
