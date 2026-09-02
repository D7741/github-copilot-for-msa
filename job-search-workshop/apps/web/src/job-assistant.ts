import type { ListingQuery } from "./api";
import type { Listing } from "./types";

export interface AssistantIntent {
  query: ListingQuery;
  summary: string;
}

const LOCATIONS = [
  "Auckland",
  "Wellington",
  "Christchurch",
  "Hamilton",
  "Tauranga",
  "Dunedin",
  "Queenstown",
];

const JOB_TERMS = [
  "software",
  "engineer",
  "developer",
  "designer",
  "product",
  "manager",
  "data",
  "security",
  "support",
  "sales",
  "account",
];

export function parseAssistantIntent(
  input: string,
  listings: Listing[],
): AssistantIntent {
  const text = input.trim().toLowerCase();
  const query: ListingQuery = { status: "active", sort: "recent" };
  const labels: string[] = [];

  if (text.includes("remote")) {
    query.workMode = "remote";
    labels.push("remote");
  } else if (text.includes("hybrid")) {
    query.workMode = "hybrid";
    labels.push("hybrid");
  } else if (text.includes("on-site") || text.includes("onsite")) {
    query.workMode = "onsite";
    labels.push("on-site");
  }

  if (text.includes("unavailable") || text.includes("closed")) {
    query.status = "unavailable";
    labels.push("unavailable");
  } else if (text.includes("stale") || text.includes("old")) {
    query.status = "stale";
    labels.push("stale");
  } else {
    labels.push("current");
  }

  if (text.includes("title") && (text.includes("a-z") || text.includes("alphabet"))) {
    query.sort = "title";
  } else if (text.includes("company") && text.includes("sort")) {
    query.sort = "company";
  }

  const companies = [...new Set(listings.map((listing) => listing.companyName))];
  const company = companies.find((name) => text.includes(name.toLowerCase()));
  if (company) {
    query.company = company;
    labels.push(`at ${company}`);
  }

  const location = LOCATIONS.find((name) => text.includes(name.toLowerCase()));
  if (location) {
    query.location = location;
    labels.push(`in ${location}`);
  }

  const jobTerm = JOB_TERMS.find((term) => text.includes(term));
  if (jobTerm) {
    query.search = jobTerm;
    labels.push(`matching “${jobTerm}”`);
  }

  return {
    query,
    summary: `I searched for ${labels.join(" ")} roles, newest first.`,
  };
}