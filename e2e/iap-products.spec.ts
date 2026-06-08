import { test, expect } from "@playwright/test";

test("returns IAP product catalog for clients", async ({ request }) => {
  const res = await request.get("/v1/meta/iap-products");
  expect(res.ok()).toBeTruthy();
  const body = (await res.json()) as {
    subscriptions: { tier: string; productId: string }[];
    products: { productId: string; kind: string }[];
  };
  expect(body.subscriptions.map((s) => s.tier).sort()).toEqual([
    "basic",
    "lite",
    "premium",
  ]);
  expect(body.products.some((p) => p.productId === "com.ctrlz.huhu.coins.small"))
    .toBe(true);
});
