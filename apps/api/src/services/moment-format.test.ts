import { describe, expect, it } from "vitest";
import { formatMomentResponse } from "./moment-format.js";

describe("formatMomentResponse", () => {
  it("parses media json and includes character name", () => {
    const out = formatMomentResponse(
      {
        id: "m1",
        characterId: "c1",
        body: "hello",
        mediaJson: JSON.stringify({
          mimeType: "image/png",
          base64: "abc",
        }),
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      "小呼",
    );
    expect(out.characterName).toBe("小呼");
    expect(out.media?.mimeType).toBe("image/png");
    expect(out.media?.base64).toBe("abc");
  });

  it("returns null media when absent", () => {
    const out = formatMomentResponse({
      id: "m2",
      characterId: "c1",
      body: "text only",
      mediaJson: null,
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    expect(out.media).toBeNull();
    expect(out.characterName).toBeUndefined();
    expect(out.visibility).toBe("private");
  });

  it("normalizes visibility to public when set", () => {
    const out = formatMomentResponse({
      id: "m3",
      characterId: "c1",
      body: "pub",
      mediaJson: null,
      visibility: "public",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    expect(out.visibility).toBe("public");
  });

  it("normalizes visibility to friends when set", () => {
    const out = formatMomentResponse({
      id: "m4",
      characterId: "c1",
      body: "friends only",
      mediaJson: null,
      visibility: "friends",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    expect(out.visibility).toBe("friends");
  });
});
