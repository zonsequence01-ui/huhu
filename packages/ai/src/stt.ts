/** OpenAI Whisper STT for inbound voice messages. */
export async function transcribeVoiceAudio(
  audioBase64: string,
  mimeType: string,
): Promise<{ ok: true; text: string } | { ok: false; reason: string }> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, reason: "stt_not_configured" };
  }

  let buf: Buffer;
  try {
    buf = Buffer.from(audioBase64, "base64");
  } catch {
    return { ok: false, reason: "invalid_audio_base64" };
  }

  const maxBytes = 5 * 1024 * 1024;
  if (buf.length === 0 || buf.length > maxBytes) {
    return { ok: false, reason: "audio_too_large" };
  }

  const ext = mimeType.includes("webm")
    ? "webm"
    : mimeType.includes("wav")
      ? "wav"
      : mimeType.includes("mp4") || mimeType.includes("m4a")
        ? "m4a"
        : "mp3";

  const form = new FormData();
  form.append(
    "file",
    new Blob([new Uint8Array(buf)], { type: mimeType || "audio/webm" }),
    `voice.${ext}`,
  );
  form.append("model", process.env.OPENAI_WHISPER_MODEL?.trim() || "whisper-1");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!res.ok) {
    return { ok: false, reason: "stt_http_error" };
  }

  const data = (await res.json()) as { text?: string };
  const text = data.text?.trim() ?? "";
  if (!text) {
    return { ok: false, reason: "stt_empty_transcript" };
  }
  return { ok: true, text };
}
