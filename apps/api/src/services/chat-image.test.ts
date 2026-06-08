import { describe, it, expect } from "vitest";
import { parseChatImage, imageLlmText } from "./chat-image.js";

const TINY_PNG =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

describe("parseChatImage", () => {
  it("accepts small png", () => {
    const r = parseChatImage(TINY_PNG, "image/png");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.mimeType).toBe("image/png");
  });

  it("rejects bad mime", () => {
    const r = parseChatImage(TINY_PNG, "image/gif");
    expect(r.ok).toBe(false);
  });
});

describe("imageLlmText", () => {
  it("includes caption when provided", () => {
    expect(imageLlmText("sunset")).toContain("sunset");
  });
});
