import { describe, expect, it } from "vitest";
import { getUiStrings } from "./ui-strings.js";
import { SUPPORTED_LOCALES } from "./locales.js";

const API_ERROR_KEYS = [
  "voiceRequiresBasic",
  "insufficientStamina",
  "insufficientCoins",
  "characterLimitReached",
  "characterNotFound",
  "ageConfirmationRequired",
  "contentRequired",
  "validationFailed",
  "rateLimited",
] as const;

const MEMORY_KEYS = [
  "memoryFragmentsTitle",
  "memoryFragmentsEmpty",
  "memoryDeleteBtn",
  "memoryDeleteConfirm",
  "memoryDeleteDone",
  "chatPrivacyDismiss",
  "openSupportPage",
  "openPrivacyPolicy",
] as const;

describe("ui-strings memory privacy", () => {
  for (const locale of SUPPORTED_LOCALES) {
    it(`defines memory keys for ${locale}`, () => {
      const table = getUiStrings(String(locale));
      for (const key of MEMORY_KEYS) {
        expect(table[key]?.length).toBeGreaterThan(0);
      }
      for (const key of API_ERROR_KEYS) {
        expect(table[key]?.length).toBeGreaterThan(0);
      }
    });
  }
});
