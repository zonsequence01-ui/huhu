import { test, expect } from "@playwright/test";

test("lists all six store catalog markets", async ({ request }) => {
  const res = await request.get("/v1/meta/store-catalog");
  expect(res.ok()).toBeTruthy();
  const body = (await res.json()) as {
    catalogs: { market: string; pricingRegion: string }[];
  };
  expect(body.catalogs.map((c) => c.market).sort()).toEqual([
    "cn",
    "jp",
    "kr",
    "tw",
    "us",
    "vn",
  ]);
  for (const c of body.catalogs) {
    expect(c.pricingRegion).toBeTruthy();
  }
});
