import {
  AFFECTION_MAX,
  AFFECTION_MIN,
  RELATIONSHIP_STAGES,
  type RelationshipStage,
} from "@huhu/shared";

export function affectionDeltaFromMessage(
  userMessage: string,
  mode: string,
): number {
  let delta = 1;
  if (mode === "long") delta += 2;
  if (mode === "exciting") delta += 3;
  if (/喜歡|愛|想你|開心|謝謝/i.test(userMessage)) delta += 2;
  if (/討厭|生氣|滾|不理/i.test(userMessage)) delta -= 3;
  return delta;
}

export function stageFromAffection(affection: number): RelationshipStage {
  if (affection >= 800) return "married";
  if (affection >= 600) return "partner";
  if (affection >= 400) return "dating";
  if (affection >= 250) return "ambiguous";
  if (affection >= 100) return "acquaintance";
  return "stranger";
}

export function clampAffection(value: number): number {
  return Math.max(AFFECTION_MIN, Math.min(AFFECTION_MAX, value));
}

export function isValidStage(stage: string): stage is RelationshipStage {
  return (RELATIONSHIP_STAGES as readonly string[]).includes(stage);
}
