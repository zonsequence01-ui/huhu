import type { RelationshipStage } from "@huhu/shared";
import { voiceForStage } from "./voice-tone.js";

export interface VoiceSynthesisResult {
  audioBase64: string;
  mimeType: string;
  provider: "openai" | "mock";
  voice?: string;
}

/** 【假設】使用 OpenAI TTS；未配置時語音僅回傳文字稿。 */
export async function synthesizeVoice(
  text: string,
  locale: string,
  stage: RelationshipStage = "acquaintance",
): Promise<VoiceSynthesisResult | null> {
  const trimmed = text.trim().slice(0, 800);
  if (!trimmed) return null;

  const provider = process.env.TTS_PROVIDER ?? "mock";
  const key = process.env.OPENAI_API_KEY;

  if (provider === "openai" && key) {
    const voice = voiceForStage(stage, locale);
    const res = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_TTS_MODEL ?? "tts-1",
        voice,
        input: trimmed,
        response_format: "mp3",
      }),
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return {
      audioBase64: buf.toString("base64"),
      mimeType: "audio/mpeg",
      provider: "openai",
      voice,
    };
  }

  if (process.env.TTS_PROVIDER === "mock" && process.env.NODE_ENV !== "production") {
    return {
      audioBase64: Buffer.from("huhu-voice-stub").toString("base64"),
      mimeType: "text/plain",
      provider: "mock",
    };
  }

  return null;
}
