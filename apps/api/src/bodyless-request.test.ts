import { describe, expect, it } from "vitest";
import { normalizeBodylessJsonContentType } from "./bodyless-request.js";

function fakeReq(
  method: string,
  headers: Record<string, string | undefined>,
) {
  return {
    method,
    headers,
    raw: {},
  } as Parameters<typeof normalizeBodylessJsonContentType>[0];
}

describe("normalizeBodylessJsonContentType", () => {
  it("removes application/json when DELETE has no body", () => {
    const req = fakeReq("DELETE", {
      "content-type": "application/json",
    });
    normalizeBodylessJsonContentType(req);
    expect(req.headers["content-type"]).toBeUndefined();
  });

  it("keeps application/json when content-length is non-zero", () => {
    const req = fakeReq("POST", {
      "content-type": "application/json",
      "content-length": "12",
    });
    normalizeBodylessJsonContentType(req);
    expect(req.headers["content-type"]).toBe("application/json");
  });

  it("ignores non-json content types", () => {
    const req = fakeReq("DELETE", {
      "content-type": "text/plain",
    });
    normalizeBodylessJsonContentType(req);
    expect(req.headers["content-type"]).toBe("text/plain");
  });
});
