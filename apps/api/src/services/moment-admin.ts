import { desc, eq, sql } from "drizzle-orm";
import type { SqliteDb } from "../db/sqlite-db.js";
import {
  characterMoments,
  characters,
  momentReports,
} from "../db/schema-bindings.js";
import { formatMomentResponse } from "./moment-format.js";

export async function listHiddenMoments(
  db: SqliteDb,
  limit: number,
): Promise<
  {
    id: string;
    characterId: string;
    characterName: string;
    body: string;
    visibility: string;
    createdAt: string;
    reportCount: number;
  }[]
> {
  const rows = await db
    .select({
      id: characterMoments.id,
      characterId: characterMoments.characterId,
      body: characterMoments.body,
      visibility: characterMoments.visibility,
      createdAt: characterMoments.createdAt,
      characterName: characters.name,
      reportCount: sql<number>`(
        SELECT COUNT(*) FROM moment_reports
        WHERE moment_id = ${characterMoments.id}
      )`.mapWith(Number),
    })
    .from(characterMoments)
    .innerJoin(characters, eq(characterMoments.characterId, characters.id))
    .where(eq(characterMoments.moderationStatus, "hidden"))
    .orderBy(desc(characterMoments.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    characterId: r.characterId,
    characterName: r.characterName,
    body: r.body,
    visibility: r.visibility,
    createdAt: r.createdAt,
    reportCount: r.reportCount,
  }));
}

export async function restoreMoment(
  db: SqliteDb,
  momentId: string,
): Promise<
  | { ok: true; moment: ReturnType<typeof formatMomentResponse> }
  | { ok: false; error: "moment_not_found" | "moment_not_hidden" }
> {
  const rows = await db
    .select()
    .from(characterMoments)
    .where(eq(characterMoments.id, momentId))
    .limit(1);
  const existing = rows[0];
  if (!existing) return { ok: false, error: "moment_not_found" };
  if (existing.moderationStatus !== "hidden") {
    return { ok: false, error: "moment_not_hidden" };
  }

  await db
    .delete(momentReports)
    .where(eq(momentReports.momentId, momentId));

  await db
    .update(characterMoments)
    .set({ moderationStatus: "active" })
    .where(eq(characterMoments.id, momentId));

  const charRows = await db
    .select({ name: characters.name })
    .from(characters)
    .where(eq(characters.id, existing.characterId))
    .limit(1);

  return {
    ok: true,
    moment: formatMomentResponse(existing, charRows[0]?.name),
  };
}
