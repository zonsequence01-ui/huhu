import { normalizeClientLocale } from "./locales.js";
import { tUi } from "./ui-strings.js";

export type TierEntitlementsLike = {
  unlimitedStamina?: boolean;
  voice?: boolean;
  premiumContent?: boolean;
  memoryRetrievalLimit?: number;
  maxReplyTokens?: number;
  maxCharacters?: number;
};

/** Localized short label for subscribe tier comparison (client-config entitlements). */
export function formatTierEntitlementsLabel(
  locale: string,
  ent: TierEntitlementsLike | null | undefined,
): string {
  if (!ent) return "";
  const loc = normalizeClientLocale(locale);
  const parts: string[] = [];
  if (ent.unlimitedStamina) {
    parts.push(tUi(loc, "tierEntUnlimitedStamina"));
  }
  if (ent.voice) {
    parts.push(tUi(loc, "tierEntVoice"));
  }
  if (ent.memoryRetrievalLimit != null) {
    parts.push(tUi(loc, "tierEntMemory", { n: ent.memoryRetrievalLimit }));
  }
  if (ent.maxReplyTokens != null) {
    parts.push(tUi(loc, "tierEntReply", { n: ent.maxReplyTokens }));
  }
  if (ent.maxCharacters != null) {
    parts.push(tUi(loc, "tierEntCharacters", { n: ent.maxCharacters }));
  }
  if (ent.premiumContent) {
    parts.push(tUi(loc, "tierEntPremium"));
  }
  return parts.join(" · ");
}
