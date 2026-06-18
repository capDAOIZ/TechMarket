export type Seniority =
  | "intern"
  | "junior"
  | "mid"
  | "senior"
  | "lead"
  | "manager"
  | "unknown";

export type Modality =
  | "remote"
  | "hybrid"
  | "onsite"
  | "unknown";

export type SourceName =
  | "arbeitnow"
  | "remotive"
  | "greenhouse"
  | "adzuna";

export type JobListItem = {
  id: string;
  title: string;

  company: {
    id: string | null;
    name: string;
    logoUrl: string | null;
  };

  location: {
    label: string;
    country: string | null;
    city: string | null;
    remote: boolean;
  };

  role: string | null;
  seniority: Seniority;
  modality: Modality;
  technologies: string[];

  salary: {
    min: number | null;
    max: number | null;
    currency: string | null;
    period: "year" | "month" | "hour" | "unknown";
  };

  source: {
    name: SourceName;
    url: string;
    attribution: string;
  };

  publishedAt: string | null;
  ingestedAt: string;
  qualityScore: number;
};

export type JobDetail = JobListItem & {
  descriptionClean: string;
  descriptionHtml: string | null;
  duplicateGroupId: string | null;
  externalId: string;
  rawSourceName: string;
};

export type PaginatedJobsResponse = {
  items: JobListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type JobsQueryParams = {
  q?: string;
  technology?: string;
  role?: string;
  seniority?: Seniority;
  modality?: Modality;
  remote?: boolean;
  source?: SourceName;
  page?: number;
  page_size?: number;
  sort?: string;
  active?: boolean;
};
