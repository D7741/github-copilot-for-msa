import { describe, expect, it } from "vitest";

import { parseAssistantIntent } from "./job-assistant";
import type { Listing } from "./types";

const listing = {
  companyName: "Pushpay",
} as Listing;

describe("parseAssistantIntent", () => {
  it("maps work mode, location, company, and role terms", () => {
    expect(
      parseAssistantIntent(
        "Show remote software jobs at Pushpay in Auckland",
        [listing],
      ).query,
    ).toEqual({
      status: "active",
      sort: "recent",
      workMode: "remote",
      company: "Pushpay",
      location: "Auckland",
      search: "software",
    });
  });

  it("recognizes stale and alphabetical title requests", () => {
    expect(parseAssistantIntent("Old roles by title A-Z", []).query).toEqual({
      status: "stale",
      sort: "title",
    });
  });
});