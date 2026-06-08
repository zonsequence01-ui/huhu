import type { RelationshipStage } from "@huhu/shared";

/** OpenAI TTS voice ids; warmer voices for closer relationship stages. */
const STAGE_VOICE: Partial<Record<RelationshipStage, string>> = {
  stranger: "echo",
  acquaintance: "alloy",
  ambiguous: "shimmer",
  dating: "nova",
  partner: "fable",
  married: "onyx",
};

function defaultLocaleVoice(locale: string): string {
  if (locale.startsWith("ja") || locale.startsWith("ko")) return "nova";
  return "alloy";
}

export function voiceForStage(
  stage: RelationshipStage,
  locale: string,
): string {
  return STAGE_VOICE[stage] ?? defaultLocaleVoice(locale);
}
