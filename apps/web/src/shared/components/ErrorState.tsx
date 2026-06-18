type ErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
};

export function ErrorState({
  title = "Something went wrong",
  description = "An error occurred while loading data. Please try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[280px] gap-3 py-12 text-center px-6">
      <div className="w-10 h-10 rounded-full border border-red-900/60 bg-red-950/40 flex items-center justify-center mb-1">
        <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-zinc-200">{title}</p>
      <p className="text-xs text-zinc-600 max-w-xs leading-relaxed">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 px-4 py-1.5 rounded-lg border border-zinc-700 text-xs font-medium text-zinc-300 
                     hover:border-zinc-500 hover:text-zinc-100 transition-colors duration-150"
        >
          Try again
        </button>
      )}
    </div>
  );
}
