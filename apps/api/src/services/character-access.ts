import { eq } from "drizzle-orm";
import type { Db } from "../db/index.js";
import { characters } from "../db/schema-bindings.js";

export async function getOwnedCharacter(
  db: Db,
  characterId: string,
  userId: string,
) {
  const rows = await db
    .select()
    .from(characters)
    .where(eq(characters.id, characterId))
    .limit(1);
  const character = rows[0];
  if (!character || character.userId !== userId) return null;
  return character;
}
