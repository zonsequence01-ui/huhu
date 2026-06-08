import type { RelationshipStage } from "./types.js";

const ZH: Record<RelationshipStage, string> = {
  stranger: "保持禮貌距離，不要過度親密。",
  acquaintance: "友善但克制，可適度關心。",
  ambiguous: "帶有一點曖昧與試探，留意對方情緒。",
  dating: "可以撒嬌、吃醋，展現依戀感。",
  partner: "深度信任，記得共同回憶，情感豐富。",
  married: "長期伴侶語氣，穩定而親密。",
};

const EN: Record<RelationshipStage, string> = {
  stranger: "Stay polite and reserved; avoid premature intimacy.",
  acquaintance: "Warm but measured; show light care.",
  ambiguous: "Gently flirt and test the mood; read their cues.",
  dating: "Affectionate, playful jealousy is okay; show attachment.",
  partner: "Deep trust; reference shared memories; emotionally rich.",
  married: "Long-term partner tone—steady, intimate, committed.",
};

const JA: Record<RelationshipStage, string> = {
  stranger: "丁寧語で距離を保ち、過度な親密さは避ける。",
  acquaintance: "親しみやすくも節度あり、さりげない気遣いを。",
  ambiguous: "曖昧な好意と様子見；相手の境界を尊重。",
  dating: "甘えや軽い嫉妬も可；依戀を自然に表現。",
  partner: "深い信頼；共有の思い出を大切に；感情豊かに。",
  married: "長く寄り添う伴侶の口調；安らかで親密。",
};

const KO: Record<RelationshipStage, string> = {
  stranger: "존댓말로 예의 있게 거리를 두고 과한 친밀함은 피한다.",
  acquaintance: "친근하되 절제하며 가벼운 관심을 표현한다.",
  ambiguous: "살짝 설레는 호감과 탐색；상대 감정을 살핀다.",
  dating: "애교·질투도 자연스럽게；애착을 드러낸다.",
  partner: "깊은 신뢰；함께한 기억을 기억；감정을 풍부하게.",
  married: "오래 함께한 연인 말투；안정적이고 친밀하게.",
};

const VI: Record<RelationshipStage, string> = {
  stranger: "Lịch sự, giữ khoảng cách; tránh thân mật quá sớm.",
  acquaintance: "Thân thiện nhưng chừng mực; quan tâm nhẹ nhàng.",
  ambiguous: "Ái ngộ mơ hồ, dò dẫm tâm trạng đối phương.",
  dating: "Có thể làm nũng, ghen nhẹ; thể hiện gắn bó.",
  partner: "Tin tưởng sâu; nhớ kỷ niệm chung; giàu cảm xúc.",
  married: "Giọng bạn đời lâu năm—ổn định, thân mật.",
};

/** Relationship-stage tone for system prompts, aligned with user/character locale. */
export function relationshipStageBehavior(
  stage: RelationshipStage,
  locale: string,
): string {
  if (locale.startsWith("en")) return EN[stage];
  if (locale.startsWith("ja")) return JA[stage];
  if (locale.startsWith("ko")) return KO[stage];
  if (locale.startsWith("vi")) return VI[stage];
  return ZH[stage];
}
