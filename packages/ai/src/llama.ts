import type { LlmProvider, LlmRequest, LlmResponse, ModelTier } from "./router.js";
import { buildUserPayload } from "./router.js";

/** OpenAI-compatible local inference (e.g. Llama 3 8B on vLLM/Ollama). */
export class LlamaCompatibleProvider implements LlmProvider {
  constructor(
    private baseUrl: string,
    private model = "llama3",
  ) {}

  async complete(
    request: LlmRequest,
    tier: ModelTier,
  ): Promise<LlmResponse> {
    const url = `${this.baseUrl.replace(/\/$/, "")}/v1/chat/completions`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.LLAMA_MODEL ?? this.model,
        max_tokens: Math.min(request.maxTokens, 1024),
        messages: [
          { role: "system", content: request.systemPrompt },
          { role: "user", content: buildUserPayload(request) },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Llama inference error: ${res.status} ${err}`);
    }

    const data = (await res.json()) as {
      choices: { message: { content: string } }[];
      usage?: { total_tokens: number };
    };

    return {
      content: data.choices[0]?.message?.content ?? "",
      modelTier: tier,
      tokensUsed: data.usage?.total_tokens ?? 0,
    };
  }
}
