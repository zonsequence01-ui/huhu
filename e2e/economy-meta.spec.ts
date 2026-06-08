import { test, expect } from "@playwright/test";

test("economy meta matches blueprint stamina rules", async ({ request }) => {
  const res = await request.get("/v1/meta/economy");
  expect(res.ok()).toBeTruthy();
  const body = (await res.json()) as {
    economy: {
      stamina: {
        max: number;
        recoverIntervalMs: number;
        costText: number;
        costVoice: number;
      };
      coins: { longMode: number; excitingMode: number };
      chatModes: string[];
    };
  };
  const economy = body.economy;
  expect(economy.stamina.max).toBe(50);
  expect(economy.stamina.recoverIntervalMs).toBe(600_000);
  expect(economy.stamina.costText).toBe(1);
  expect(economy.stamina.costVoice).toBe(3);
  expect(economy.coins.longMode).toBe(5);
  expect(economy.coins.excitingMode).toBe(10);
  expect(economy.chatModes).toEqual(["simple", "long", "exciting"]);
});
