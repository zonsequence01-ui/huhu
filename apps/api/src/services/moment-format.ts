import type { MomentVisibility } from "./moment-visibility.js";

export type MomentRow = {
  id: string;
  characterId: string;
  body: string;
  mediaJson: string | null;
  visibility?: string | null;
  createdAt: string;
};

export function formatMomentResponse(
  row: MomentRow,
  characterName?: string,
): {
  id: string;
  characterId: string;
  characterName?: string;
  body: string;
  visibility: MomentVisibility;
  media: { mimeType: string; base64: string } | null;
  createdAt: string;
} {
  const visibility: MomentVisibility =
    row.visibility === "public"
      ? "public"
      : row.visibility === "friends"
        ? "friends"
        : "private";
  return {
    id: row.id,
    characterId: row.characterId,
    ...(characterName ? { characterName } : {}),
    body: row.body,
    visibility,
    media: row.mediaJson
      ? (JSON.parse(row.mediaJson) as { mimeType: string; base64: string })
      : null,
    createdAt: row.createdAt,
  };
}
