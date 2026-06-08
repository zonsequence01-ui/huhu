import { normalizeClientLocale } from "./locales.js";
import { formatSubscriptionTierDisplayName } from "./tier-display-name.js";
import { getUiStrings, type UiStringKey } from "./ui-strings.js";

const ERROR_UI_KEYS: Record<string, UiStringKey> = {
  voice_requires_basic_subscription: "voiceRequiresBasic",
  insufficient_stamina: "insufficientStamina",
  insufficient_coins: "insufficientCoins",
  character_limit_reached: "characterLimitReached",
  character_not_found: "characterNotFound",
  age_confirmation_required: "ageConfirmationRequired",
  content_required: "contentRequired",
  validation_failed: "validationFailed",
  rate_limited: "rateLimited",
};

export const API_ERROR_CODES = Object.keys(ERROR_UI_KEYS);

/** Maps API `error` codes to localized user-facing text. */
export function formatApiErrorMessage(locale: string, code: string): string {
  const key = ERROR_UI_KEYS[code];
  if (!key) return code;
  const loc = normalizeClientLocale(locale?.trim() || "zh-TW");
  const table = getUiStrings(loc);
  let text = table[key] ?? code;
  if (code === "voice_requires_basic_subscription") {
    const tier = formatSubscriptionTierDisplayName(loc, "basic");
    text = text.replaceAll("{tier}", tier);
  }
  return text;
}

export function isKnownApiErrorCode(code: string): boolean {
  return code in ERROR_UI_KEYS;
}

/** Pre-localized API error messages for client-config (locale-aware). */
export function buildApiErrorsMeta(locale: string): Record<string, string> {
  const loc = normalizeClientLocale(locale?.trim() || "zh-TW");
  return Object.fromEntries(
    API_ERROR_CODES.map((code) => [code, formatApiErrorMessage(loc, code)]),
  );
}
