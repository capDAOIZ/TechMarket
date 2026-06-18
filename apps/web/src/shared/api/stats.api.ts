import {
  mockModalities,
  mockRoles,
  mockSeniority,
  mockSummary,
  mockTechnologies,
  mockTechnologyTrends,
} from "../mock/stats.mock";
import type {
  BucketStat,
  DashboardSummary,
  TechnologyStat,
  TechnologyTrendPoint,
} from "../types/stats";
import { apiFetch } from "./client";
import type {
  ApiBucketStat,
  ApiDashboardSummary,
  ApiTechnologyStat,
  ApiTechnologyTrendPoint,
} from "./contracts";

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

function toBucketStats(rows: ApiBucketStat[]): BucketStat[] {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  return rows.map((row) => ({
    label: row.value ? row.value[0].toUpperCase() + row.value.slice(1) : "Unknown",
    count: row.count,
    percentage: total ? (100 * row.count) / total : 0,
  }));
}
export async function getSummary(): Promise<DashboardSummary> {
  if (USE_MOCKS) return mockSummary;
  const row = await apiFetch<ApiDashboardSummary>("/stats/summary");
  return {
    totalJobs: row.total_jobs,
    totalCompanies: row.total_companies,
    totalSources: row.total_sources,
    remotePercentage: row.remote_percentage,
    salaryCoveragePercentage: row.salary_coverage_percentage,
    lastIngestionAt: row.last_ingestion_at,
  };
}

export async function getTechnologies(): Promise<TechnologyStat[]> {
  if (USE_MOCKS) return mockTechnologies;
  const rows = await apiFetch<ApiTechnologyStat[]>("/stats/technologies");
  return rows.map((row) => ({
    technology: row.technology,
    jobCount: row.count,
    percentage: (row.share ?? 0) * 100,
    trendDirection: "unknown",
  }));
}

async function getBuckets(path: string, mock: BucketStat[]): Promise<BucketStat[]> {
  if (USE_MOCKS) return mock;
  return toBucketStats(await apiFetch<ApiBucketStat[]>(path));
}

export const getRoles = () => getBuckets("/stats/roles", mockRoles);
export const getSeniority = () => getBuckets("/stats/seniority", mockSeniority);
export const getModalities = () => getBuckets("/stats/modalities", mockModalities);

export async function getTechnologyTrends(): Promise<TechnologyTrendPoint[]> {
  if (USE_MOCKS) return mockTechnologyTrends;
  const rows = await apiFetch<ApiTechnologyTrendPoint[]>("/trends/technologies");
  return rows.map((row) => ({
    week: row.week_start,
    technology: row.technology,
    jobCount: row.count,
  }));
}
