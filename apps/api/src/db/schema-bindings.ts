import * as sqliteSchema from "./schema.js";
import * as pgSchema from "./schema-pg.js";

type SchemaTables = typeof sqliteSchema;

export let users: SchemaTables["users"] = sqliteSchema.users;
export let characters: SchemaTables["characters"] = sqliteSchema.characters;
export let relationships: SchemaTables["relationships"] =
  sqliteSchema.relationships;
export let messages: SchemaTables["messages"] = sqliteSchema.messages;
export let offerwallRedemptions: SchemaTables["offerwallRedemptions"] =
  sqliteSchema.offerwallRedemptions;
export let memoryChunks: SchemaTables["memoryChunks"] =
  sqliteSchema.memoryChunks;
export let iapReceipts: SchemaTables["iapReceipts"] = sqliteSchema.iapReceipts;
export let diaryEntries: SchemaTables["diaryEntries"] =
  sqliteSchema.diaryEntries;
export let characterMoments: SchemaTables["characterMoments"] =
  sqliteSchema.characterMoments;
export let momentReports: SchemaTables["momentReports"] =
  sqliteSchema.momentReports;
export let userFriendships: SchemaTables["userFriendships"] =
  sqliteSchema.userFriendships;
export let userBlocks: SchemaTables["userBlocks"] = sqliteSchema.userBlocks;
export let rateLimitBuckets: SchemaTables["rateLimitBuckets"] =
  sqliteSchema.rateLimitBuckets;

export function useSqliteSchema(): void {
  users = sqliteSchema.users;
  characters = sqliteSchema.characters;
  relationships = sqliteSchema.relationships;
  messages = sqliteSchema.messages;
  offerwallRedemptions = sqliteSchema.offerwallRedemptions;
  memoryChunks = sqliteSchema.memoryChunks;
  iapReceipts = sqliteSchema.iapReceipts;
  diaryEntries = sqliteSchema.diaryEntries;
  characterMoments = sqliteSchema.characterMoments;
  momentReports = sqliteSchema.momentReports;
  userFriendships = sqliteSchema.userFriendships;
  userBlocks = sqliteSchema.userBlocks;
  rateLimitBuckets = sqliteSchema.rateLimitBuckets;
}

export function usePostgresSchema(): void {
  users = pgSchema.users as unknown as SchemaTables["users"];
  characters = pgSchema.characters as unknown as SchemaTables["characters"];
  relationships =
    pgSchema.relationships as unknown as SchemaTables["relationships"];
  messages = pgSchema.messages as unknown as SchemaTables["messages"];
  offerwallRedemptions =
    pgSchema.offerwallRedemptions as unknown as SchemaTables["offerwallRedemptions"];
  memoryChunks =
    pgSchema.memoryChunks as unknown as SchemaTables["memoryChunks"];
  iapReceipts =
    pgSchema.iapReceipts as unknown as SchemaTables["iapReceipts"];
  diaryEntries =
    pgSchema.diaryEntries as unknown as SchemaTables["diaryEntries"];
  characterMoments =
    pgSchema.characterMoments as unknown as SchemaTables["characterMoments"];
  momentReports =
    pgSchema.momentReports as unknown as SchemaTables["momentReports"];
  userFriendships =
    pgSchema.userFriendships as unknown as SchemaTables["userFriendships"];
  userBlocks = pgSchema.userBlocks as unknown as SchemaTables["userBlocks"];
  rateLimitBuckets =
    pgSchema.rateLimitBuckets as unknown as SchemaTables["rateLimitBuckets"];
}
