import { expect, type APIRequestContext, type Page } from "@playwright/test";

export type WebSessionSeed = {
  token: string;
  userId: string;
  characterId?: string | null;
  /** Extra keys to set/remove before app.js loads (value `null` removes). */
  extraLocalStorage?: Record<string, string | null>;
};

export async function waitForApiHealth(
  request: APIRequestContext,
  timeout = 60_000,
): Promise<void> {
  await expect
    .poll(async () => (await request.get("/health")).ok(), { timeout })
    .toBe(true);
}

export async function bootstrapUser(request: APIRequestContext): Promise<{
  token: string;
  userId: string;
}> {
  const boot = await request.post("/v1/users/bootstrap");
  expect(boot.ok()).toBeTruthy();
  return (await boot.json()) as { token: string; userId: string };
}

export async function verifyCharacterOwned(
  request: APIRequestContext,
  token: string,
  characterId: string,
): Promise<void> {
  const res = await request.get(`/v1/characters/${characterId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(res.ok()).toBeTruthy();
}

/** Seed localStorage before app.js loads to avoid bootstrap/token races. */
export async function openWebSession(
  page: Page,
  seed: WebSessionSeed,
): Promise<void> {
  await page.addInitScript((s: WebSessionSeed) => {
    localStorage.setItem("huhu_token", s.token);
    localStorage.setItem("huhu_userId", s.userId);
    if (s.characterId) {
      localStorage.setItem("huhu_characterId", s.characterId);
    } else {
      localStorage.removeItem("huhu_characterId");
    }
    for (const [key, value] of Object.entries(s.extraLocalStorage ?? {})) {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    }
  }, seed);
  await page.goto("/");
}

/** Stats bar populated means ensureSession + refreshProfile finished. */
export async function waitForWebReady(
  page: Page,
  timeout = 45_000,
): Promise<void> {
  await page.locator("#input").waitFor({ state: "visible", timeout });
  await expect(page.locator("#stats")).not.toBeEmpty({ timeout });
  await expect(
    page.locator(".bubble.assistant", {
      hasText: /連線失敗|Connection failed/i,
    }),
  ).toHaveCount(0);
}
