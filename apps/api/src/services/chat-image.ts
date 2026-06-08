const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
]);

const MAX_BYTES = 2 * 1024 * 1024;

export type ParsedChatImage =
  | { ok: true; mimeType: string; base64: string }
  | { ok: false; reason: string };

export function parseChatImage(
  base64: string | undefined,
  mimeType: string | undefined,
): ParsedChatImage {
  const raw = base64?.trim();
  if (!raw) return { ok: false, reason: "image_required" };
  const mime = (mimeType?.trim() || "image/jpeg").toLowerCase();
  if (!ALLOWED_MIME.has(mime)) {
    return { ok: false, reason: "image_mime_not_allowed" };
  }
  let buf: Buffer;
  try {
    buf = Buffer.from(raw, "base64");
  } catch {
    return { ok: false, reason: "image_invalid_base64" };
  }
  if (buf.length === 0 || buf.length > MAX_BYTES) {
    return { ok: false, reason: "image_too_large" };
  }
  return { ok: true, mimeType: mime, base64: raw };
}

export function imageMemoryText(caption: string): string {
  const c = caption.trim();
  return c ? `[照片] ${c}` : "[照片] 使用者分享了一張圖片";
}

export function imageLlmText(caption: string): string {
  const c = caption.trim();
  return c
    ? `[使用者分享照片] ${c}`
    : "[使用者分享了一張照片，請根據角色設定溫暖回應並可詢問照片內容相關細節]";
}

export function imageLlmTextWithVision(
  caption: string,
  visionDescription: string,
): string {
  const c = caption.trim();
  const desc = visionDescription.trim();
  if (c) {
    return `[使用者分享照片] ${desc}（使用者補充：${c}）`;
  }
  return `[使用者分享照片] ${desc}`;
}
