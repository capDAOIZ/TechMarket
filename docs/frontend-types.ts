export type Role =
  | "backend"
  | "frontend"
  | "fullstack"
  | "data"
  | "devops"
  | "mobile"
  | "qa"
  | "security"
  | "machine_learning"
  | "management"
  | "software";

export type Seniority = "intern" | "junior" | "senior" | "lead" | "manager";
export type Modality = "remote" | "hybrid" | "onsite";

export interface JobListItem {
  id: number;
  title: string;
  company_name: string;
  location: string | null;
  role: Role | null;
  seniority: Seniority | null;
  modality: Modality | null;
  remote: boolean | null;
  technologies: string[];
  published_at: string | null;
  source_name: string;
  source_url: string;
  attribution: string;
  first_seen_at: string;
  last_seen_at: string;
  is_active: boolean;
  closed_at: string | null;
}

export interface PaginatedJobsResponse {
  items: JobListItem[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface JobDetail extends JobListItem {
  external_id: string;
  location_raw: string | null;
  country_code: string | null;
  description: string | null;
  fetched_at: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  salary_period: string | null;
  quality_score: number;
  duplicate_group_id: string | null;
}

export interface DashboardSummary {
  total_jobs: number;
  total_companies: number;
  total_sources: number;
  total_technologies: number;
  latest_published_at: string | null;
}

export interface TechnologyStat {
  technology: string;
  count: number;
  share: number | null;
}

export interface BucketStat {
  value: string | null;
  count: number;
}

export interface TechnologyTrendPoint {
  week_start: string;
  technology: string;
  count: number;
  share: number | null;
}

export interface PipelineSourceRun {
  source_name: string;
  status: "running" | "success" | "failed";
  fetched_count: number;
  started_at: string;
  finished_at: string | null;
  error_message: string | null;
}

export interface PipelineRun {
  id: number;
  status: "running" | "success" | "partial_success" | "failed";
  requested_sources: string[];
  started_at: string;
  finished_at: string | null;
  fetched_count: number;
  loaded_count: number;
  discarded_count: number;
  error_message: string | null;
  source_runs: PipelineSourceRun[];
}

export interface SourceResponse {
  id: number;
  name: string;
  attribution: string;
  homepage_url: string;
  active: boolean;
}
