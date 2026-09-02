export type SourceStatus = "approved" | "pending" | "rejected";

export interface PolicyReview {
  reviewer: string | null;
  reviewedAt: string | null;
  termsUrl: string | null;
  robotsUrl: string | null;
  evidenceUrl: string | null;
  notes: string;
}

export interface Source {
  id: string;
  name: string;
  careersUrl: string;
  endpointUrl: string | null;
  sourceType: string;
  enabled: boolean;
  policyStatus: SourceStatus;
  policyReview: PolicyReview;
}

export interface Listing {
  id: string;
  sourceId: string;
  companyName: string;
  title: string;
  location: string | null;
  summary: string | null;
  postedAt: string | null;
  sourceUrl: string;
  firstSeenAt: string;
  lastSeenAt: string;
  status: "active" | "stale" | "unavailable";
}

export type ListingSort = "recent" | "title" | "company" | "location";

export interface ListingFilters {
  search?: string;
  company?: string;
  location?: string;
  sourceId?: string;
  sort?: ListingSort;
  status?: Listing["status"];
}

export interface CollectionRun {
  id: string;
  startedAt: string;
  completedAt: string | null;
  status: "running" | "completed" | "partial" | "failed";
  sourceCount: number;
  successCount: number;
  skippedCount: number;
  failureCount: number;
}
