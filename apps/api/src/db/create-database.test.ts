import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { createDatabase } from "./create-database.js";

const env = { ...process.env };
let tmpDir: string | undefined;

afterEach(async () => {
  process.env = { ...env };
  if (tmpDir) {
    try {
      rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      /* Windows sqlite lock */
    }
    tmpDir = undefined;
  }
});

describe("createDatabase", () => {
  it("uses sqlite when dbPath is set even if DATABASE_URL is postgres", async () => {
    process.env.DATABASE_URL =
      "postgresql://user:pass@ep-example.neon.tech/huhu?sslmode=require";
    tmpDir = mkdtempSync(join(tmpdir(), "huhu-db-test-"));
    const dbPath = join(tmpDir, "override.db");

    const handle = await createDatabase({ path: dbPath });
    expect(handle.driver).toBe("sqlite");
    handle.close();
  });
});
