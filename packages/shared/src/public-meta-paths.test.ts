import { describe, expect, it } from "vitest";
import { PUBLIC_META_PATHS, assertPublicMeta } from "./public-meta-paths.js";

describe("public-meta-paths", () => {
  it("assertPublicMeta accepts canonical paths", () => {
    expect(assertPublicMeta({ ...PUBLIC_META_PATHS })).toBe(true);
  });

  it("assertPublicMeta rejects incomplete index", () => {
    expect(assertPublicMeta({ clientConfig: PUBLIC_META_PATHS.clientConfig })).toBe(
      false,
    );
  });
});
