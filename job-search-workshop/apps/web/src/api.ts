import type {
  CollectionRun,
  Listing,
  ListingSort,
  ListingStatus,
  Source,
  WorkMode,
} from "./types";

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(
      body?.error ?? `Request failed with status ${response.status}.`,
    );
  }
  return (await response.json()) as T;
}

export async function getSources(): Promise<Source[]> {
  const result = await requestJson<{ sources: Source[] }>("/api/sources");
  return result.sources;
}

export interface ListingQuery {
  search?: string;
  sort?: ListingSort;
  status?: ListingStatus;
  company?: string;
  location?: string;
  workMode?: WorkMode;
}

export async function getListings(query: ListingQuery = {}): Promise<Listing[]> {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.sort && query.sort !== "recent") params.set("sort", query.sort);
  if (query.status) params.set("status", query.status);
  if (query.company) params.set("company", query.company);
  if (query.location) params.set("location", query.location);
  if (query.workMode) params.set("workMode", query.workMode);
  const searchParams = params.toString() ? `?${params.toString()}` : "";
  const result = await requestJson<{ listings: Listing[] }>(
    `/api/listings${searchParams}`,
  );
  return result.listings;
}

export async function getLatestRun(): Promise<CollectionRun | null> {
  const result = await requestJson<{ run: CollectionRun | null }>(
    "/api/collection-runs/latest",
  );
  return result.run;
}

export async function startCollection(): Promise<CollectionRun> {
  const result = await requestJson<{ run: CollectionRun }>(
    "/api/collection-runs",
    { method: "POST" },
  );
  return result.run;
}
