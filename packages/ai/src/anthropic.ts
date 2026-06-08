import type { LlmProvider, LlmRequest, LlmResponse, ModelTier } from "./router.js";
import { buildUserPayload } from "./router.js";

export class AnthropicLlmProvider implements LlmProvider {
  constructor(
    private apiKey: string,
    private lightModel = "claude-3-5-haiku-20241022",
    private premiumModel = "claude-3-5-sonnet-20241022",
  ) {}

  async complete(
    request: LlmRequest,
    tier: ModelTier,
  ): Promise<LlmResponse> {
    const model = tier === "premium" ? this.premiumModel : this.lightModel;
    const userContent = buildUserPayload(request);

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: Math.min(request.maxTokens, 2048),
        system: request.systemPrompt,
        messages: [{ role: "user", content: userContent }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic error: ${res.status} ${err}`);
    }

    const data = (await res.json()) as {
      content: { type: string; text: string }[];
      usage?: { input_tokens: number; output_tokens: number };
    };

    const text =
      data.content.find((c) => c.type === "text")?.text ??
      data.content[0]?.text ??
      "";

    const tokens =
      (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0);

    return {
      content: text,
      modelTier: tier,
      tokensUsed: tokens,
    };
  }
}
