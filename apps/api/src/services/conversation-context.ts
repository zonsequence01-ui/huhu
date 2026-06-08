import { desc, eq } from "drizzle-orm";
import type { Db } from "../db/index.js";
import { messages } from "../db/schema-bindings.js";

export interface ConversationTurn {
  role: string;
  content: string;
}

export async function loadRecentTurns(
  db: Db,
  characterId: string,
  limit = 12,
): Promise<ConversationTurn[]> {
  const rows = await db
    .select({
      role: messages.role,
      content: messages.content,
    })
    .from(messages)
    .where(eq(messages.characterId, characterId))
    .orderBy(desc(messages.createdAt))
    .limit(limit);
  return rows.reverse().map((r) => ({
    role: r.role,
    content: r.content.slice(0, 600),
  }));
}

export function formatRecentTurnsBlock(turns: ConversationTurn[]): string {
  if (turns.length === 0) return "";
  const lines = turns.map((t) => {
    const who = t.role === "user" ? "使用者" : "角色";
    return `${who}：${t.content}`;
  });
  return `\n最近對話紀錄：\n${lines.join("\n")}`;
}
