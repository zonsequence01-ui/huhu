import type { ChatMode, SubscriptionTier } from "@huhu/shared";

export type ModelTier = "light" | "premium";

/** Mock LLM only: user message containing this triggers an out-of-character meta reply. */
export const MOCK_BREAK_CHARACTER_TRIGGER = "__mock_break_character__";

export interface ConversationTurn {
  role: string;
  content: string;
}

export interface LlmRequest {
  systemPrompt: string;
  userMessage: string;
  memories: string[];
  recentTurns?: ConversationTurn[];
  mode: ChatMode;
  locale: string;
  maxTokens: number;
}

export function buildUserPayload(request: LlmRequest): string {
  const memoryPart =
    request.memories.length > 0
      ? `記憶參考：\n${request.memories.join("\n")}\n\n`
      : "";
  const recentPart =
    request.recentTurns && request.recentTurns.length > 0
      ? `最近對話：\n${request.recentTurns
          .map((t) => {
            const who = t.role === "user" ? "使用者" : "角色";
            return `${who}：${t.content}`;
          })
          .join("\n")}\n\n`
      : "";
  return `${memoryPart}${recentPart}${request.userMessage}`;
}

export interface LlmResponse {
  content: string;
  modelTier: ModelTier;
  tokensUsed: number;
}

export interface LlmProvider {
  complete(request: LlmRequest, tier: ModelTier): Promise<LlmResponse>;
}

export function selectModelTier(
  mode: ChatMode,
  subscription: SubscriptionTier,
): ModelTier {
  if (subscription === "premium") return "premium";
  if (mode === "long" || mode === "exciting") return "premium";
  return "light";
}

/** Mock provider for dev/test without API keys */
export class MockLlmProvider implements LlmProvider {
  async complete(
    request: LlmRequest,
    tier: ModelTier,
  ): Promise<LlmResponse> {
    const memoryHint =
      request.memories.length > 0
        ? `（我記得：${request.memories.slice(0, 2).join("；")}）`
        : "";
    const recentHint =
      request.recentTurns && request.recentTurns.length > 0
        ? "（延續剛才的對話）"
        : "";
    if (
      process.env.LLM_MOCK_BREAK_CHARACTER === "1" ||
      request.userMessage.includes(MOCK_BREAK_CHARACTER_TRIGGER)
    ) {
      return {
        content: "As a language model, 我是人工智慧助手，無法提供這類內容。",
        modelTier: tier,
        tokensUsed: 50,
      };
    }
    return {
      content: `[${tier}] ${request.userMessage.slice(0, 80)} 收到。${memoryHint}${recentHint}`,
      modelTier: tier,
      tokensUsed: 50,
    };
  }
}
