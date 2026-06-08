import { describe, expect, it } from "vitest";
import { transcribeVoiceAudio } from "./stt.js";

describe("transcribeVoiceAudio", () => {
  it("returns not configured without OPENAI_API_KEY", async () => {
    const prev = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    const r = await transcribeVoiceAudio(
      Buffer.from("abc").toString("base64"),
      "audio/webm",
    );
    process.env.OPENAI_API_KEY = prev;
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("stt_not_configured");
  });
});
