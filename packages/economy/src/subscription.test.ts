import { describe, expect, it } from "vitest";
import { memoryRetrievalLimit, maxReplyTokens } from "./subscription.js";

describe("subscription limits", () => {
  it("scales memory and reply tokens by tier", () => {
    expect(memoryRetrievalLimit("free")).toBe(5);
    expect(memoryRetrievalLimit("basic")).toBe(16);
    expect(memoryRetrievalLimit("premium")).toBe(20);
    expect(maxReplyTokens("basic")).toBe(3000);
    expect(maxReplyTokens("premium")).toBe(4096);
  });
});
