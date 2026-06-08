type MessageRow = {
  id: string;
  characterId: string;
  role: string;
  content: string;
  mode: string;
  mediaJson: string | null;
  createdAt: string;
};

type ParsedMediaJson = {
  mimeType?: string;
  data?: string;
  safety?: { category?: string };
  characterGuard?: { corrected?: boolean };
};

export function formatMessageForClient(row: MessageRow) {
  const base: Record<string, unknown> = {
    id: row.id,
    characterId: row.characterId,
    role: row.role,
    content: row.content,
    mode: row.mode,
    createdAt: row.createdAt,
  };
  if (!row.mediaJson) return base;
  try {
    const parsed = JSON.parse(row.mediaJson) as ParsedMediaJson;
    if (parsed.safety?.category) {
      base.safety = {
        flagged: true,
        category: parsed.safety.category,
      };
    }
    if (parsed.characterGuard?.corrected) {
      base.characterCorrected = true;
    }
    if (parsed.data && parsed.mimeType) {
      base.media = {
        mimeType: parsed.mimeType,
        imageBase64: parsed.data,
      };
    }
  } catch {
    /* ignore corrupt */
  }
  return base;
}
