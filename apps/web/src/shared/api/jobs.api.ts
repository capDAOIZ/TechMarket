import type { PaginatedJobsResponse, JobDetail, JobsQueryParams } from "../types/jobs";
import { mockJobList, mockJobDetails, buildPaginatedResponse } from "../mock/jobs.mock";

const USE_MOCK = !import.meta.env.VITE_API_URL;

/**
 * Fetch a paginated list of jobs with optional filters.
 * Swap USE_MOCK → false when the FastAPI backend is ready.
 */
export async function getJobs(
  params: JobsQueryParams = {}
): Promise<PaginatedJobsResponse> {
  if (USE_MOCK) {
    await delay(400);
    let results = [...mockJobList];

    // Apply client-side mock filtering
    if (params.q) {
      const q = params.q.toLowerCase();
      results = results.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.company.name.toLowerCase().includes(q) ||
          j.technologies.some((t: string) => t.toLowerCase().includes(q))
      );
    }
    if (params.technology) {
      const tech = params.technology.toLowerCase();
      results = results.filter((j) =>
        j.technologies.some((t: string) => t.toLowerCase().includes(tech))
      );
    }
    if (params.seniority) {
      results = results.filter((j) => j.seniority === params.seniority);
    }
    if (params.modality) {
      results = results.filter((j) => j.modality === params.modality);
    }
    if (params.remote !== undefined) {
      results = results.filter((j) => j.location.remote === params.remote);
    }
    if (params.source) {
      results = results.filter((j) => j.source.name === params.source);
    }

    const page = params.page ?? 1;
    const pageSize = params.page_size ?? 10;
    return buildPaginatedResponse(results, page, pageSize);
  }

  const { apiFetch } = await import("./client");
  return apiFetch<PaginatedJobsResponse>("/jobs", params as Record<string, string>);
}

/**
 * Fetch a single job by ID.
 */
export async function getJobById(id: string): Promise<JobDetail> {
  if (USE_MOCK) {
    await delay(300);
    const detail = mockJobDetails.find((j) => j.id === id);
    if (detail) return detail;
    // Fallback: wrap list item as detail
    const listItem = mockJobList.find((j) => j.id === id);
    if (listItem) {
      return {
        ...listItem,
        descriptionClean: "No detailed description available for this job.",
        descriptionHtml: null,
        duplicateGroupId: null,
        externalId: id,
        rawSourceName: listItem.source.name,
      };
    }
    throw { message: `Job ${id} not found`, status: 404 };
  }

  const { apiFetch } = await import("./client");
  return apiFetch<JobDetail>(`/jobs/${id}`);
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
