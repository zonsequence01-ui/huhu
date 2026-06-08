export interface SupportedLocale {
  id: string;
  label: string;
}

/** Blueprint: zh-TW, zh-CN, ja-JP, ko-KR, en */
export const SUPPORTED_LOCALES: SupportedLocale[] = [
  { id: "zh-TW", label: "繁體中文（台灣）" },
  { id: "zh-CN", label: "简体中文" },
  { id: "ja-JP", label: "日本語" },
  { id: "ko-KR", label: "한국어" },
  { id: "en", label: "English" },
  { id: "vi-VN", label: "Tiếng Việt" },
];

export const SUPPORTED_LOCALE_IDS = [
  "zh-TW",
  "zh-CN",
  "ja-JP",
  "ko-KR",
  "en",
  "vi-VN",
] as const;

export type SupportedLocaleId = (typeof SUPPORTED_LOCALE_IDS)[number];

export function isSupportedLocale(locale: string): locale is SupportedLocaleId {
  return (SUPPORTED_LOCALE_IDS as readonly string[]).includes(locale);
}

/** Map BCP-47 tags (e.g. en-US) to a supported locale id. */
export function normalizeClientLocale(locale: string): SupportedLocaleId {
  if (locale.startsWith("en")) return "en";
  if (locale === "zh-CN" || locale.startsWith("zh-Hans")) return "zh-CN";
  if (locale.startsWith("ja")) return "ja-JP";
  if (locale.startsWith("ko")) return "ko-KR";
  if (locale.startsWith("vi")) return "vi-VN";
  if (isSupportedLocale(locale)) return locale;
  return "zh-TW";
}
