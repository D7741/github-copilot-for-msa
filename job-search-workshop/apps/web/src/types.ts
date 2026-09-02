export interface Source {
  id: string;
  name: string;
  careersUrl: string;
  endpointUrl: string | null;
  sourceType: string;
  enabled: boolean;
  policyStatus: "approved" | "pending" | "rejected";
}

export type ListingSort = "recent" | "title" | "company" | "location";
export type ListingStatus = "active" | "stale" | "unavailable";
export type WorkMode = "remote" | "hybrid" | "onsite";

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
  status: ListingStatus;
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
