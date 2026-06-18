import { mockJobDetails, mockJobList, buildPaginatedResponse } from "../mock/jobs.mock";
import type {
  JobDetail,
  JobListItem,
  JobsQueryParams,
  Modality,
  PaginatedJobsResponse,
  Seniority,
  SourceName,
} from "../types/jobs";
import { apiFetch } from "./client";
import type {
  ApiJobDetail,
  ApiJobListItem,
  ApiPaginatedJobsResponse,
} from "./contracts";

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

function toSeniority(value: string | null): Seniority {
  const allowed: Seniority[] = ["intern", "junior", "senior", "lead", "manager"];
  return allowed.includes(value as Seniority) ? (value as Seniority) : "unknown";
}

function toModality(value: string | null): Modality {
  return value === "remote" || value === "hybrid" || value === "onsite"
    ? value
    : "unknown";
}

function toSource(value: string): SourceName {
  return value === "arbeitnow" || value === "remotive" || value === "greenhouse"
    ? value
    : "arbeitnow";
}

function toSalaryPeriod(value: string | null): JobListItem["salary"]["period"] {
  return value === "year" || value === "month" || value === "hour" ? value : "unknown";
}

function toJobListItem(job: ApiJobListItem): JobListItem {
  const location = job.location ?? "Location not specified";
  return {
    id: String(job.id),
    title: job.title,
    company: { id: null, name: job.company_name, logoUrl: null },
    location: {
      label: location,
      country: null,
      city: job.remote ? null : location,
      remote: job.remote === true,
    },
    role: job.role,
    seniority: toSeniority(job.seniority),
    modality: toModality(job.modality),
    technologies: job.technologies,
    salary: {
      min: job.salary_min,
      max: job.salary_max,
      currency: job.salary_currency,
      period: toSalaryPeriod(job.salary_period),
    },
    source: {
      name: toSource(job.source_name),
      url: job.source_url,
      attribution: job.attribution,
    },
    publishedAt: job.published_at,
    ingestedAt: job.fetched_at,
    qualityScore: job.quality_score,
  };
}

function toJobDetail(job: ApiJobDetail): JobDetail {
  return {
    ...toJobListItem(job),
    descriptionClean: job.description ?? "No description available for this job.",
    descriptionHtml: null,
    duplicateGroupId: job.duplicate_group_id,
    externalId: job.external_id,
    rawSourceName: job.source_name,
  };
}

export async function getJobs(
  params: JobsQueryParams = {},
): Promise<PaginatedJobsResponse> {
  if (USE_MOCKS) {
    return buildPaginatedResponse(mockJobList, params.page ?? 1, params.page_size ?? 10);
  }
  const response = await apiFetch<ApiPaginatedJobsResponse>(
    "/jobs",
    params as Record<string, string | number | boolean | undefined>,
  );
  return {
    items: response.items.map(toJobListItem),
    page: response.page,
    pageSize: response.page_size,
    total: response.total,
    totalPages: response.total_pages,
  };
}

export async function getJobById(id: string): Promise<JobDetail> {
  if (USE_MOCKS) {
    const detail = mockJobDetails.find((job) => job.id === id);
    if (detail) return detail;
    throw { message: `Job ${id} not found`, status: 404 };
  }
  return toJobDetail(await apiFetch<ApiJobDetail>(`/jobs/${id}`));
}
