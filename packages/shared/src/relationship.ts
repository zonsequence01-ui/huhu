import type { RelationshipStage } from "./types.js";
import { AFFECTION_MAX } from "./constants.js";

/** Default zh-Hant labels (backward compatible). */
export const STAGE_LABELS: Record<RelationshipStage, string> = {
  stranger: "陌生人",
  acquaintance: "熟人",
  ambiguous: "曖昧",
  dating: "交往",
  partner: "伴侶",
  married: "靈魂伴侶",
};

const STAGE_LABELS_EN: Record<RelationshipStage, string> = {
  stranger: "Stranger",
  acquaintance: "Acquaintance",
  ambiguous: "Ambiguous",
  dating: "Dating",
  partner: "Partner",
  married: "Soulmate",
};

const STAGE_LABELS_JA: Record<RelationshipStage, string> = {
  stranger: "知らない人",
  acquaintance: "知人",
  ambiguous: "曖昧",
  dating: "付き合い中",
  partner: "パートナー",
  married: "ソウルメイト",
};

const STAGE_LABELS_KO: Record<RelationshipStage, string> = {
  stranger: "낯선 사람",
  acquaintance: "아는 사이",
  ambiguous: "썸",
  dating: "연애 중",
  partner: "연인",
  married: "소울메이트",
};

const STAGE_LABELS_VI: Record<RelationshipStage, string> = {
  stranger: "Người lạ",
  acquaintance: "Quen biết",
  ambiguous: "Mập mờ",
  dating: "Hẹn hò",
  partner: "Người yêu",
  married: "Tri kỷ",
};

const STAGE_LABELS_ZH_CN: Record<RelationshipStage, string> = {
  stranger: "陌生人",
  acquaintance: "熟人",
  ambiguous: "暧昧",
  dating: "交往",
  partner: "伴侣",
  married: "灵魂伴侣",
};

/** Localized relationship stage label for UI and API responses. */
export function stageLabelForLocale(
  stage: RelationshipStage,
  locale?: string,
): string {
  const loc = locale?.trim() ?? "";
  if (loc.startsWith("en")) return STAGE_LABELS_EN[stage];
  if (loc.startsWith("ja")) return STAGE_LABELS_JA[stage];
  if (loc.startsWith("ko")) return STAGE_LABELS_KO[stage];
  if (loc.startsWith("vi")) return STAGE_LABELS_VI[stage];
  if (loc === "zh-CN" || loc.startsWith("zh-Hans")) {
    return STAGE_LABELS_ZH_CN[stage];
  }
  return STAGE_LABELS[stage];
}

export function affectionPercent(affection: number): number {
  if (affection <= 0) return 0;
  const pct = Math.round((affection / AFFECTION_MAX) * 100);
  return Math.max(1, Math.min(100, pct));
}
