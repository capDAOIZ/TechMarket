import type {
  DashboardSummary,
  TechnologyStat,
  BucketStat,
  TechnologyTrendPoint,
} from "../types/stats";

export const mockSummary: DashboardSummary = {
  totalJobs: 2847,
  totalCompanies: 634,
  totalSources: 4,
  remotePercentage: 58.3,
  salaryCoveragePercentage: 42.1,
  lastIngestionAt: "2026-06-16T11:00:00Z",
};

export const mockTechnologies: TechnologyStat[] = [
  { technology: "Python",     jobCount: 872, percentage: 30.6, trendDirection: "up" },
  { technology: "TypeScript", jobCount: 734, percentage: 25.8, trendDirection: "up" },
  { technology: "React",      jobCount: 681, percentage: 23.9, trendDirection: "flat" },
  { technology: "Go",         jobCount: 412, percentage: 14.5, trendDirection: "up" },
  { technology: "Kubernetes", jobCount: 389, percentage: 13.7, trendDirection: "up" },
  { technology: "AWS",        jobCount: 367, percentage: 12.9, trendDirection: "flat" },
  { technology: "PostgreSQL", jobCount: 334, percentage: 11.7, trendDirection: "flat" },
  { technology: "Docker",     jobCount: 298, percentage: 10.5, trendDirection: "down" },
  { technology: "Node.js",    jobCount: 276, percentage: 9.7,  trendDirection: "down" },
  { technology: "Rust",       jobCount: 201, percentage: 7.1,  trendDirection: "up" },
  { technology: "GraphQL",    jobCount: 188, percentage: 6.6,  trendDirection: "flat" },
  { technology: "Terraform",  jobCount: 172, percentage: 6.0,  trendDirection: "up" },
];

export const mockSeniority: BucketStat[] = [
  { label: "Intern",  count: 142, percentage: 5.0 },
  { label: "Junior",  count: 398, percentage: 14.0 },
  { label: "Mid",     count: 853, percentage: 30.0 },
  { label: "Senior",  count: 967, percentage: 34.0 },
  { label: "Lead",    count: 341, percentage: 12.0 },
  { label: "Unknown", count: 146, percentage: 5.1 },
];

export const mockModalities: BucketStat[] = [
  { label: "Remote",  count: 1660, percentage: 58.3 },
  { label: "Hybrid",  count: 712,  percentage: 25.0 },
  { label: "On-site", count: 398,  percentage: 14.0 },
  { label: "Unknown", count: 77,   percentage: 2.7 },
];

export const mockRoles: BucketStat[] = [
  { label: "Backend Engineer",    count: 612, percentage: 21.5 },
  { label: "Frontend Engineer",   count: 498, percentage: 17.5 },
  { label: "Full Stack Developer",count: 423, percentage: 14.9 },
  { label: "ML Engineer",         count: 334, percentage: 11.7 },
  { label: "DevOps / SRE",        count: 289, percentage: 10.2 },
  { label: "Data Engineer",       count: 245, percentage: 8.6 },
  { label: "Mobile Developer",    count: 187, percentage: 6.6 },
  { label: "Cloud Architect",     count: 156, percentage: 5.5 },
  { label: "QA Engineer",         count: 103, percentage: 3.6 },
];

// ─── Technology trend data (last 8 weeks) ────────────────────────────────────
const weeks = [
  "2026-04-20", "2026-04-27", "2026-05-04", "2026-05-11",
  "2026-05-18", "2026-05-25", "2026-06-01", "2026-06-08",
];

const trendData: Record<string, number[]> = {
  Python:     [210, 225, 232, 248, 260, 271, 285, 310],
  TypeScript: [160, 172, 180, 191, 200, 213, 228, 245],
  React:      [155, 158, 161, 165, 163, 167, 170, 172],
  Go:         [ 88,  95, 100, 108, 115, 118, 124, 132],
  Rust:       [ 42,  48,  52,  58,  63,  69,  76,  85],
};

export const mockTechnologyTrends: TechnologyTrendPoint[] = Object.entries(
  trendData
).flatMap(([technology, counts]) =>
  weeks.map((week, i) => ({ week, technology, jobCount: counts[i] }))
);
