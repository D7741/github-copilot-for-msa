import type { Listing, Source } from "./models.js";

export type CollectedListing = Pick<
  Listing,
  "title" | "location" | "summary" | "sourceUrl"
>;

type SourceAdapter = (payload: unknown) => CollectedListing[];

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function asHttpsUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

export function parseGreenhouseJobs(payload: unknown): CollectedListing[] {
  const jobs = asRecord(payload)?.jobs;
  if (!Array.isArray(jobs)) return [];

  const listings = new Map<string, CollectedListing>();
  for (const job of jobs) {
    const record = asRecord(job);
    const title = record?.title;
    const sourceUrl = asHttpsUrl(record?.absolute_url);
    if (typeof title !== "string" || !title.trim() || !sourceUrl) continue;

    const location = asRecord(record?.location)?.name;
    listings.set(sourceUrl, {
      title: title.trim(),
      location: typeof location === "string" && location.trim() ? location.trim() : null,
      summary: null,
      sourceUrl,
    });
  }

  return [...listings.values()];
}

const adapters: Record<string, SourceAdapter> = {
  greenhouse: parseGreenhouseJobs,
};

export async function collectListings(source: Source): Promise<CollectedListing[]> {
  const adapter = adapters[source.sourceType];
  if (!adapter || !source.endpointUrl) {
    throw new Error("No structured adapter is configured for this source.");
  }

  const response = await fetch(source.endpointUrl, {
    headers: { "user-agent": "JobFinderMvp/0.1 (local job search)" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Request failed with ${response.status}`);

  return adapter(await response.json());
}