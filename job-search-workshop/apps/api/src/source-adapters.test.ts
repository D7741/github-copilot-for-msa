import { describe, expect, it } from "vitest";

import { parseGreenhouseJobs } from "./source-adapters.js";

describe("parseGreenhouseJobs", () => {
  it("maps a structured response and skips malformed jobs", () => {
    const listings = parseGreenhouseJobs({
      jobs: [
        {
          title: "  Senior Software Engineer  ",
          absolute_url: "https://job-boards.greenhouse.io/pushpay/jobs/123",
          location: { name: "Auckland, New Zealand" },
        },
        {
          title: "Missing URL",
          location: { name: "Auckland, New Zealand" },
        },
        {
          title: "Unsafe URL",
          absolute_url: "http://job-boards.greenhouse.io/pushpay/jobs/456",
        },
      ],
    });

    expect(listings).toEqual([
      {
        title: "Senior Software Engineer",
        location: "Auckland, New Zealand",
        summary: null,
        sourceUrl: "https://job-boards.greenhouse.io/pushpay/jobs/123",
      },
    ]);
  });

  it("returns an empty list for a changed or empty response schema", () => {
    expect(parseGreenhouseJobs({ openings: [] })).toEqual([]);
    expect(parseGreenhouseJobs({ jobs: [] })).toEqual([]);
  });
});