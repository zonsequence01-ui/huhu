import { test, expect } from "@playwright/test";

test("store-catalog productIds match iap-products", async ({ request }) => {
  const [iapRes, catalogRes] = await Promise.all([
    request.get("/v1/meta/iap-products"),
    request.get("/v1/meta/store-catalog?market=tw"),
  ]);
  expect(iapRes.ok()).toBeTruthy();
  expect(catalogRes.ok()).toBeTruthy();

  const iap = (await iapRes.json()) as {
    subscriptions: { productId: string }[];
    products: { productId: string; kind: string }[];
  };
  const catalog = (await catalogRes.json()) as {
    catalog: {
      productIds: { subscriptions: string[]; coins: string[] };
    };
  };

  const subIds = iap.subscriptions.map((s) => s.productId).sort();
  const coinIds = iap.products
    .filter((p) => p.kind === "coins")
    .map((p) => p.productId)
    .sort();

  expect(catalog.catalog.productIds.subscriptions.sort()).toEqual(subIds);
  expect(catalog.catalog.productIds.coins.sort()).toEqual(coinIds);
});
