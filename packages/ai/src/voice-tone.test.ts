import { describe, expect, it } from "vitest";
import { voiceForStage } from "./voice-tone.js";

describe("voiceForStage", () => {
  it("uses warmer voice for partner stage", () => {
    expect(voiceForStage("partner", "zh-TW")).toBe("fable");
    expect(voiceForStage("stranger", "en")).toBe("echo");
  });
});
