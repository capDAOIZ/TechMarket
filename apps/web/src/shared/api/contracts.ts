export type ApiJobListItem = {
  id: number;
  title: string;
  company_name: string;
  location: string | null;
  role: string | null;
  seniority: string | null;
  modality: string | null;
  remote: boolean | null;
  technologies: string[];
  published_at: string | null;
  fetched_at: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  salary_period: string | null;
  quality_score: number;
  source_name: string;
  source_url: string;
  attribution: string;
  first_seen_at: string;
  last_seen_at: string;
  is_active: boolean;
  closed_at: string | null;
};

export type ApiJobDetail = ApiJobListItem & {
  external_id: string;
  location_raw: string | null;
  country_code: string | null;
  description: string | null;
  duplicate_group_id: string | null;
};

export type ApiPaginatedJobsResponse = {
  items: ApiJobListItem[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
};

export type ApiDashboardSummary = {
  total_jobs: number;
  total_companies: number;
  total_sources: number;
  total_technologies: number;
  latest_published_at: string | null;
  remote_percentage: number;
  salary_coverage_percentage: number;
  last_ingestion_at: string | null;
};

export type ApiTechnologyStat = {
  technology: string;
  count: number;
  share: number | null;
};

export type ApiBucketStat = { value: string | null; count: number };

export type ApiTechnologyTrendPoint = {
  week_start: string;
  technology: string;
  count: number;
  share: number | null;
};

export type ApiPipelineSourceRun = {
  source_name: string;
  status: "running" | "success" | "failed";
  fetched_count: number;
  started_at: string;
  finished_at: string | null;
  error_message: string | null;
};

export type ApiPipelineRun = {
  id: number;
  status: "running" | "success" | "partial_success" | "failed";
  requested_sources: string[];
  started_at: string;
  finished_at: string | null;
  fetched_count: number;
  loaded_count: number;
  discarded_count: number;
  error_message: string | null;
  source_runs: ApiPipelineSourceRun[];
};

