import type { LlmProvider, LlmRequest, LlmResponse, ModelTier } from "./router.js";

/** Routes light tier to local Llama and premium tier to cloud API. */
export class RoutingLlmProvider implements LlmProvider {
  constructor(
    private light: LlmProvider,
    private premium: LlmProvider,
  ) {}

  async complete(
    request: LlmRequest,
    tier: ModelTier,
  ): Promise<LlmResponse> {
    const provider = tier === "premium" ? this.premium : this.light;
    return provider.complete(request, tier);
  }
}
