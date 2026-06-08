/** Cultural tone hints for system prompts */
export const LOCALE_HINTS: Record<string, string> = {
  "zh-TW":
    "使用繁體中文與台灣網路語感，可適度使用在地流行語（如小奶狗、傲嬌），避免過度文言。",
  "zh-CN": "使用簡體中文與大陸常用表達，語氣自然口語，可適度網路用語。",
  "ja-JP":
    "使用日語，依情境正確運用敬語、丁寧語與親暱語氣的切換，曖昧表達需符合日本社交界線。",
  "ko-KR":
    "使用韓語，注意長幼尊卑（존댓말/반말）與親密關係的語氣差異。",
  en: "Use natural conversational English with warm tone; light humor is fine.",
  "vi-VN":
    "Sử dụng tiếng Việt tự nhiên, ấm áp; tôn trọng văn hóa Đông Nam Á và giọng thân mật phù hợp mối quan hệ.",
};

export function localeHint(locale: string): string {
  if (locale.startsWith("en")) return LOCALE_HINTS.en!;
  if (locale === "zh-CN" || locale.startsWith("zh-Hans")) {
    return LOCALE_HINTS["zh-CN"]!;
  }
  if (locale.startsWith("ja")) return LOCALE_HINTS["ja-JP"]!;
  if (locale.startsWith("ko")) return LOCALE_HINTS["ko-KR"]!;
  if (locale.startsWith("vi")) return LOCALE_HINTS["vi-VN"]!;
  return LOCALE_HINTS[locale] ?? LOCALE_HINTS["zh-TW"]!;
}
