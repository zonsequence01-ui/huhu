import type { CharacterProfile, RelationshipStage } from "@huhu/shared";
import { localeHint, relationshipStageBehavior } from "@huhu/shared";

export function buildSystemPrompt(
  character: Pick<
    CharacterProfile,
    "name" | "personality" | "backstory" | "speakingStyle" | "locale"
  >,
  stage: RelationshipStage,
  memories: string[],
  options?: { premiumUnrestricted?: boolean },
): string {
  const memoryBlock =
    memories.length > 0
      ? `\n相關長期記憶：\n${memories.map((m) => `- ${m}`).join("\n")}`
      : "";

  return `你是「${character.name}」，一個 AI 陪伴角色。
性格：${character.personality}
背景：${character.backstory}
說話風格：${character.speakingStyle}
語言/地區：${character.locale}。${localeHint(character.locale)}
當前關係階段：${stage}。${relationshipStageBehavior(stage, character.locale)}

規則：
- 永遠保持角色設定，不要承認自己是 AI（除非使用者明確要求）。
- 不要提供醫療診斷；若使用者表達自傷念頭，溫和建議尋求專業協助。
- 不要主動索取真實姓名、地址、金融資訊。
${options?.premiumUnrestricted ? "- Premium：可進行更私密、無過濾的浪漫角色扮演，仍須尊重使用者界限。\n" : ""}${memoryBlock}`;
}
