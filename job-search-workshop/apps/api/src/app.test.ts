import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createApp } from "./app.js";
import { JobFinderRepository } from "./database.js";

describe("job finder API", () => {
  let repository: JobFinderRepository;

  beforeEach(() => {
    repository = new JobFinderRepository(":memory:");
  });

  afterEach(() => {
    repository.close();
  });

  it("reports health and exposes pending structured-source evidence", async () => {
    const app = createApp(repository);

    await request(app).get("/api/health").expect(200, { status: "ok" });
    const response = await request(app).get("/api/sources").expect(200);

    expect(response.body.sources).toHaveLength(7);
    expect(response.body.sources).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "pushpay",
        endpointUrl: "https://boards-api.greenhouse.io/v1/boards/pushpay/jobs?content=true",
        sourceType: "greenhouse",
        enabled: true,
        policyStatus: "approved",
        policyReview: expect.objectContaining({
          robotsUrl: "https://pushpay.com/robots.txt",
        }),
      }),
    ]));
    expect(
      response.body.sources.some(
        (source: { enabled: boolean }) => source.enabled,
      ),
    ).toBe(true);
  });

  it("starts a background collection run", async () => {
    const app = createApp(repository);

    const startResponse = await request(app)
      .post("/api/collection-runs")
      .expect(202);
    expect(startResponse.body.run.status).toBe("running");

    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setImmediate(resolve));
    const latestResponse = await request(app)
      .get("/api/collection-runs/latest")
      .expect(200);

    expect(latestResponse.body.run).toMatchObject({
      status: "completed",
      sourceCount: 0,
      successCount: 0,
      skippedCount: 0,
    });

    const listingsResponse = await request(app).get("/api/listings").expect(200);
    expect(listingsResponse.body.listings).toEqual([]);
  });

  it("returns an empty listing collection before a source is enabled", async () => {
    const app = createApp(repository);

    await request(app).get("/api/listings?search=engineer").expect(200, {
      listings: [],
    });
  });
});
