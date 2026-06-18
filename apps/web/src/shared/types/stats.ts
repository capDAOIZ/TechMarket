export type DashboardSummary = {
  totalJobs: number;
  totalCompanies: number;
  totalSources: number;
  remotePercentage: number;
  salaryCoveragePercentage: number;
  lastIngestionAt: string | null;
};

export type TechnologyStat = {
  technology: string;
  jobCount: number;
  percentage: number;
  trendDirection: "up" | "down" | "flat" | "unknown";
};

export type BucketStat = {
  label: string;
  count: number;
  percentage: number;
};

export type TechnologyTrendPoint = {
  week: string;
  technology: string;
  jobCount: number;
};
