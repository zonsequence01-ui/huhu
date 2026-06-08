import { describe, it, expect } from "vitest";
import { describeChatImage } from "./vision.js";

describe("describeChatImage", () => {
  it("returns not configured without API key", async () => {
    const prev = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    const r = await describeChatImage("abc", "image/png");
    if (prev) process.env.OPENAI_API_KEY = prev;
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("vision_not_configured");
  });
});
