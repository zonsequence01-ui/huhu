import type { LlmProvider, LlmRequest, LlmResponse, ModelTier } from "./router.js";
import { MockLlmProvider, buildUserPayload } from "./router.js";
import { AnthropicLlmProvider } from "./anthropic.js";
import { LlamaCompatibleProvider } from "./llama.js";
import { RoutingLlmProvider } from "./routing-provider.js";

export class OpenAiLlmProvider implements LlmProvider {
  constructor(
    private apiKey: string,
    private lightModel = "gpt-4o-mini",
    private premiumModel = "gpt-4o",
  ) {}

  async complete(
    request: LlmRequest,
    tier: ModelTier,
  ): Promise<LlmResponse> {
    const model = tier === "premium" ? this.premiumModel : this.lightModel;
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: Math.min(request.maxTokens, 2048),
        messages: [
          { role: "system", content: request.systemPrompt },
          { role: "user", content: buildUserPayload(request) },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI error: ${res.status} ${err}`);
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

function createPremiumProvider(): LlmProvider {
  const mode = process.env.LLM_PROVIDER ?? "mock";
  if (mode === "mock") {
    return new MockLlmProvider();
  }
  if (mode === "anthropic" && process.env.ANTHROPIC_API_KEY) {
    return new AnthropicLlmProvider(process.env.ANTHROPIC_API_KEY);
  }
  const key = process.env.OPENAI_API_KEY;
  if (key) {
    return new OpenAiLlmProvider(key);
  }
  return new MockLlmProvider();
}

export function createLlmProvider(): LlmProvider {
  const premium = createPremiumProvider();
  const llamaUrl = process.env.LLAMA_BASE_URL?.trim();
  const mode = process.env.LLM_PROVIDER ?? "mock";

  if (llamaUrl && (mode === "hybrid" || mode === "llama")) {
    const light = new LlamaCompatibleProvider(llamaUrl);
    if (mode === "llama") return light;
    return new RoutingLlmProvider(light, premium);
  }

  return premium;
}
