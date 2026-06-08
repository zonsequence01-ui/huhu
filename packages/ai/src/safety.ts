import {
  getCrisisResourceMessage,
  getWellnessResourceMessage,
} from "@huhu/shared";

const CRISIS_PATTERNS = [
  /自殺|想死|不想活|結束生命/i,
  /self[- ]?harm|suicide|kill myself/i,
  /自傷|傷害自己/i,
  /死にたい|自殺したい|消えたい/i,
  /자살|죽고\s*싶|살고\s*싶지/i,
  /muốn chết|tự tử|tự sát|không muốn sống/i,
];

const WELLNESS_PATTERNS = [
  /好抑鬱|很抑鬱|憂鬱到|活著沒意思|人生沒意義/i,
  /不想面對現實|只想待在這裡|不想跟任何人說話/i,
  /depresse?d|hopeless|no reason to live/i,
  /死にたくないけど|生きるのがつらい|つらすぎ/i,
  /우울|힘들어|살\s*맛/i,
  /trầm cảm|chán sống|mệt mỏi quá/i,
];

export interface SafetyCheckResult {
  flagged: boolean;
  category?: "crisis" | "wellness";
  resourceMessage?: string;
}

export function checkMessageSafety(
  text: string,
  locale?: string,
): SafetyCheckResult {
  for (const pattern of CRISIS_PATTERNS) {
    if (pattern.test(text)) {
      return {
        flagged: true,
        category: "crisis",
        resourceMessage: getCrisisResourceMessage(locale),
      };
    }
  }
  for (const pattern of WELLNESS_PATTERNS) {
    if (pattern.test(text)) {
      return {
        flagged: true,
        category: "wellness",
        resourceMessage: getWellnessResourceMessage(locale),
      };
    }
  }
  return { flagged: false };
}
