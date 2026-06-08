import { and, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { SqliteDb } from "../db/sqlite-db.js";
import {
  characterMoments,
  characters,
  momentReports,
} from "../db/schema-bindings.js";

export const MOMENT_REPORT_REASONS = [
  "spam",
  "harassment",
  "inappropriate",
  "other",
] as const;
export type MomentReportReason = (typeof MOMENT_REPORT_REASONS)[number];

export function momentReportHideThreshold(): number {
  const raw = Number(process.env.MOMENT_REPORT_HIDE_THRESHOLD ?? "3");
  if (!Number.isFinite(raw) || raw < 1) return 3;
  return Math.min(20, Math.floor(raw));
}

export type SubmitMomentReportResult =
  | { ok: true; alreadyReported: true; hidden: boolean; reportCount: number }
  | { ok: true; alreadyReported: false; hidden: boolean; reportCount: number }
  | { ok: false; error: "moment_not_found" | "cannot_report_own" };

export async function submitMomentReport(
  db: SqliteDb,
  momentId: string,
  reporterUserId: string,
  reason: MomentReportReason,
): Promise<SubmitMomentReportResult> {
  const momentRows = await db
    .select({
      id: characterMoments.id,
      characterId: characterMoments.characterId,
      moderationStatus: characterMoments.moderationStatus,
    })
    .from(characterMoments)
    .where(eq(characterMoments.id, momentId))
    .limit(1);
  const moment = momentRows[0];
  if (!moment) return { ok: false, error: "moment_not_found" };

  const ownerRows = await db
    .select({ userId: characters.userId })
    .from(characters)
    .where(eq(characters.id, moment.characterId))
    .limit(1);
  const ownerId = ownerRows[0]?.userId;
  if (ownerId === reporterUserId) {
    return { ok: false, error: "cannot_report_own" };
  }

  const existing = await db
    .select({ id: momentReports.id })
    .from(momentReports)
    .where(
      and(
        eq(momentReports.momentId, momentId),
        eq(momentReports.reporterUserId, reporterUserId),
      ),
    )
    .limit(1);

  const threshold = momentReportHideThreshold();
  let hidden = moment.moderationStatus === "hidden";

  if (existing.length === 0) {
    await db.insert(momentReports).values({
      id: nanoid(),
      momentId,
      reporterUserId,
      reason,
      createdAt: new Date().toISOString(),
    });
  }

  const countRows = await db
    .select({ count: sql<number>`count(*)` })
    .from(momentReports)
    .where(eq(momentReports.momentId, momentId));
  const reportCount = Number(countRows[0]?.count ?? 0);

  if (!hidden && reportCount >= threshold) {
    await db
      .update(characterMoments)
      .set({ moderationStatus: "hidden" })
      .where(eq(characterMoments.id, momentId));
    hidden = true;
  }

  if (existing.length > 0) {
    return { ok: true, alreadyReported: true, hidden, reportCount };
  }
  return { ok: true, alreadyReported: false, hidden, reportCount };
}
