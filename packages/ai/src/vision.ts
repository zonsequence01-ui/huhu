import { scrubPii } from "./pii.js";

/** OpenAI vision for inbound chat photos. Falls back when unconfigured. */
export async function describeChatImage(
  imageBase64: string,
  mimeType: string,
): Promise<{ ok: true; description: string } | { ok: false; reason: string }> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, reason: "vision_not_configured" };
  }

  const model =
    process.env.OPENAI_VISION_MODEL?.trim() || "gpt-4o-mini";

  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 280,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  "Describe this image in 2-3 concise sentences for an AI companion roleplay chat. Focus on mood, setting, and visible details. Plain text only.",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
      }),
    });
  } catch {
    return { ok: false, reason: "vision_network_error" };
  }

  if (!res.ok) {
    return { ok: false, reason: "vision_http_error" };
  }

  let data: { choices?: { message?: { content?: string } }[] };
  try {
    data = (await res.json()) as typeof data;
  } catch {
    return { ok: false, reason: "vision_invalid_response" };
  }
  const raw = data.choices?.[0]?.message?.content?.trim() ?? "";
  if (!raw) {
    return { ok: false, reason: "vision_empty_description" };
  }
  return { ok: true, description: scrubPii(raw) };
}
