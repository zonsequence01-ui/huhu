import { describe, it, expect, afterEach } from "vitest";
import { buildUserPayload, MockLlmProvider } from "./router.js";

describe("buildUserPayload", () => {
  it("includes memories and recent turns before user message", () => {
    const payload = buildUserPayload({
      systemPrompt: "",
      userMessage: "你好",
      memories: ["喜歡貓"],
      recentTurns: [{ role: "user", content: "昨天很累" }],
      mode: "simple",
      locale: "zh-TW",
      maxTokens: 100,
    });
    expect(payload).toContain("喜歡貓");
    expect(payload).toContain("昨天很累");
    expect(payload.endsWith("你好")).toBe(true);
  });
});

describe("MockLlmProvider", () => {
  afterEach(() => {
    delete process.env.LLM_MOCK_BREAK_CHARACTER;
  });

  it("returns meta reply when message contains mock break trigger", async () => {
    const provider = new MockLlmProvider();
    const res = await provider.complete(
      {
        systemPrompt: "",
        userMessage: "hello __mock_break_character__",
        memories: [],
        mode: "simple",
        locale: "zh-TW",
        maxTokens: 100,
      },
      "light",
    );
    expect(res.content).toMatch(/language model|人工智慧/i);
  });
});
