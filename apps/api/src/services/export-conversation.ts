import { stageLabelForLocale, type RelationshipStage } from "@huhu/shared";
import { scrubPii } from "@huhu/ai";

export interface ExportMessage {
  role: string;
  content: string;
  createdAt: string;
  safetyCategory?: string;
  characterCorrected?: boolean;
}

export interface ExportCharacter {
  name: string;
  locale?: string;
}

export function formatWebNovelExport(
  character: ExportCharacter,
  messages: ExportMessage[],
  stage: RelationshipStage,
): string {
  const stageLabel = stageLabelForLocale(stage, character.locale);
  const header = `# ${character.name} × 你\n\n> 關係階段：${stageLabel}\n> 匯出時間：${new Date().toISOString()}\n\n---\n\n`;
  const body = messages
    .map((m) => {
      const speaker = m.role === "user" ? "你" : character.name;
      const content = m.role === "user" ? scrubPii(m.content) : m.content;
      const tag = m.safetyCategory
        ? " *(支援資源)*"
        : m.characterCorrected
          ? " *(角色修正)*"
          : "";
      return `**${speaker}**${tag}：${content}`;
    })
    .join("\n\n");
  return header + body + "\n";
}
