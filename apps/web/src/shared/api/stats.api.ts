import type {
  DashboardSummary,
  TechnologyStat,
  BucketStat,
  TechnologyTrendPoint,
} from "../types/stats";
import {
  mockSummary,
  mockTechnologies,
  mockSeniority,
  mockModalities,
  mockRoles,
  mockTechnologyTrends,
} from "../mock/stats.mock";

const USE_MOCK = !import.meta.env.VITE_API_URL;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getSummary(): Promise<DashboardSummary> {
  if (USE_MOCK) { await delay(350); return mockSummary; }
  const { apiFetch } = await import("./client");
  return apiFetch<DashboardSummary>("/stats/summary");
}

export async function getTechnologies(): Promise<TechnologyStat[]> {
  if (USE_MOCK) { await delay(400); return mockTechnologies; }
  const { apiFetch } = await import("./client");
  return apiFetch<TechnologyStat[]>("/stats/technologies");
}

export async function getRoles(): Promise<BucketStat[]> {
  if (USE_MOCK) { await delay(350); return mockRoles; }
  const { apiFetch } = await import("./client");
  return apiFetch<BucketStat[]>("/stats/roles");
}

export async function getSeniority(): Promise<BucketStat[]> {
  if (USE_MOCK) { await delay(350); return mockSeniority; }
  const { apiFetch } = await import("./client");
  return apiFetch<BucketStat[]>("/stats/seniority");
}

export async function getModalities(): Promise<BucketStat[]> {
  if (USE_MOCK) { await delay(350); return mockModalities; }
  const { apiFetch } = await import("./client");
  return apiFetch<BucketStat[]>("/stats/modalities");
}

export async function getTechnologyTrends(): Promise<TechnologyTrendPoint[]> {
  if (USE_MOCK) { await delay(400); return mockTechnologyTrends; }
  const { apiFetch } = await import("./client");
  return apiFetch<TechnologyTrendPoint[]>("/trends/technologies");
}
