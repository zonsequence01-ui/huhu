export const MOMENT_VISIBILITY_VALUES = [
  "private",
  "friends",
  "public",
] as const;
export type MomentVisibility = (typeof MOMENT_VISIBILITY_VALUES)[number];

export function normalizeMomentVisibility(
  value: unknown,
): MomentVisibility {
  if (value === "public") return "public";
  if (value === "friends") return "friends";
  return "private";
}
