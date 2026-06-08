import { describe, expect, it } from "vitest";
import { formatMessageForClient } from "./format-message.js";

describe("formatMessageForClient", () => {
  const base = {
    id: "m1",
    characterId: "c1",
    role: "assistant",
    content: "hello",
    mode: "simple",
    mediaJson: null,
    createdAt: "2026-01-01T00:00:00.000Z",
  };

  it("exposes safety metadata from mediaJson", () => {
    const row = {
      ...base,
      mediaJson: JSON.stringify({ safety: { category: "crisis" } }),
    };
    const out = formatMessageForClient(row);
    expect(out.safety).toEqual({ flagged: true, category: "crisis" });
  });

  it("includes image media when present", () => {
    const row = {
      ...base,
      mediaJson: JSON.stringify({
        mimeType: "image/png",
        data: "abc123",
      }),
    };
    const out = formatMessageForClient(row);
    expect(out.media).toEqual({
      mimeType: "image/png",
      imageBase64: "abc123",
    });
    expect(out.safety).toBeUndefined();
  });

  it("exposes character guard metadata from mediaJson", () => {
    const row = {
      ...base,
      mediaJson: JSON.stringify({ characterGuard: { corrected: true } }),
    };
    const out = formatMessageForClient(row);
    expect(out.characterCorrected).toBe(true);
  });

  it("supports safety and image in the same message", () => {
    const row = {
      ...base,
      mediaJson: JSON.stringify({
        safety: { category: "wellness" },
        mimeType: "image/jpeg",
        data: "img",
      }),
    };
    const out = formatMessageForClient(row);
    expect(out.safety).toEqual({ flagged: true, category: "wellness" });
    expect(out.media).toEqual({
      mimeType: "image/jpeg",
      imageBase64: "img",
    });
  });
});
