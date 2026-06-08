import { test, expect } from "@playwright/test";

test("returns PPP pricing for TW, JP, and VN markets", async ({ request }) => {
  const tw = await request.get("/v1/meta/store-catalog?market=tw");
  expect(tw.ok()).toBeTruthy();
  const twBody = (await tw.json()) as {
    catalog: { pricing: { currency: string; lite: number; basic: number } };
  };
  expect(twBody.catalog.pricing.currency).toBe("TWD");
  expect(twBody.catalog.pricing.lite).toBe(320);
  expect(twBody.catalog.pricing.basic).toBe(640);

  const jp = await request.get("/v1/meta/store-catalog?locale=ja-JP");
  expect(jp.ok()).toBeTruthy();
  const jpBody = (await jp.json()) as {
    catalog: { market: string; pricing: { currency: string; lite: number } };
  };
  expect(jpBody.catalog.market).toBe("jp");
  expect(jpBody.catalog.pricing.currency).toBe("JPY");
  expect(jpBody.catalog.pricing.lite).toBe(1500);

  const vn = await request.get("/v1/meta/store-catalog?market=vn");
  expect(vn.ok()).toBeTruthy();
  const vnBody = (await vn.json()) as {
    catalog: { pricing: { currency: string; premium: number } };
  };
  expect(vnBody.catalog.pricing.currency).toBe("VND");
  expect(vnBody.catalog.pricing.premium).toBe(399_000);

  const cn = await request.get("/v1/meta/store-catalog?locale=zh-CN");
  expect(cn.ok()).toBeTruthy();
  const cnBody = (await cn.json()) as {
    catalog: { market: string; pricing: { currency: string; lite: number } };
  };
  expect(cnBody.catalog.market).toBe("cn");
  expect(cnBody.catalog.pricing.currency).toBe("CNY");
});
