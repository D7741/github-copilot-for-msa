import express from "express";

import {
  CollectionAlreadyRunningError,
  CollectionService,
} from "./collection-service.js";
import { JobFinderRepository } from "./database.js";
import type { Listing, ListingSort, WorkMode } from "./models.js";

function optionalQuery(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

const LISTING_SORT_VALUES: ListingSort[] = ["recent", "title", "company", "location"];

function optionalSort(value: unknown): ListingSort | undefined {
  return LISTING_SORT_VALUES.includes(value as ListingSort)
    ? (value as ListingSort)
    : undefined;
}

const LISTING_STATUS_VALUES: Listing["status"][] = [
  "active",
  "stale",
  "unavailable",
];

function optionalStatus(value: unknown): Listing["status"] | undefined {
  return LISTING_STATUS_VALUES.includes(value as Listing["status"])
    ? (value as Listing["status"])
    : undefined;
}

const WORK_MODE_VALUES: WorkMode[] = ["remote", "hybrid", "onsite"];

function optionalWorkMode(value: unknown): WorkMode | undefined {
  return WORK_MODE_VALUES.includes(value as WorkMode)
    ? (value as WorkMode)
    : undefined;
}

export function createApp(repository: JobFinderRepository) {
  const app = express();
  const collectionService = new CollectionService(repository);

  app.disable("x-powered-by");
  app.use(express.json({ limit: "16kb" }));

  app.get("/api/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  app.get("/api/sources", (_request, response) => {
    response.json({ sources: repository.listSources() });
  });

  app.get("/api/listings", (request, response) => {
    const listings = repository.listListings({
      search: optionalQuery(request.query.search),
      company: optionalQuery(request.query.company),
      location: optionalQuery(request.query.location),
      sourceId: optionalQuery(request.query.source),
      sort: optionalSort(request.query.sort),
      status: optionalStatus(request.query.status),
      workMode: optionalWorkMode(request.query.workMode),
    });
    response.json({ listings });
  });

  app.get("/api/collection-runs/latest", (_request, response) => {
    response.json({ run: repository.getLatestCollectionRun() });
  });

  app.post("/api/collection-runs", (_request, response) => {
    try {
      const run = collectionService.start();
      response.status(202).json({ run });
    } catch (error) {
      if (error instanceof CollectionAlreadyRunningError) {
        response.status(409).json({ error: error.message });
        return;
      }
      throw error;
    }
  });

  return app;
}
