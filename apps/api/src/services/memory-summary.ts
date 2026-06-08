import type { VectorStore } from "@huhu/ai";
import { createEmbedFn } from "@huhu/ai";
import { nanoid } from "nanoid";

export interface MessageLine {
  role: string;
  content: string;
}

const SUMMARY_EVERY_N_MESSAGES = 20;

export function shouldSummarizeMemory(messageCount: number): boolean {
  return messageCount > 0 && messageCount % SUMMARY_EVERY_N_MESSAGES === 0;
}

export function buildMemorySummary(lines: MessageLine[]): string {
  const userSnippets = lines
    .filter((l) => l.role === "user")
    .map((l) => l.content.trim().slice(0, 80))
    .filter(Boolean)
    .slice(-6);
  if (userSnippets.length === 0) {
    return "近期互動：使用者與角色持續交流，關係穩定發展。";
  }
  return `近期重要記憶：${userSnippets.join("；")}`;
}

export async function persistMemorySummary(
  store: VectorStore,
  characterId: string,
  lines: MessageLine[],
): Promise<void> {
  const summary = buildMemorySummary(lines);
  const id = `summary-${nanoid(8)}`;
  const embed = createEmbedFn();
  await store.upsert({
    id,
    characterId,
    content: summary,
    embedding: await embed(summary),
    importance: 3,
    createdAt: new Date().toISOString(),
  });
}
