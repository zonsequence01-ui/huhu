import pg from "pg";

const url = process.env.DATABASE_URL?.trim();
if (!url?.startsWith("postgresql")) {
  console.error("Set DATABASE_URL to a Neon Postgres URL");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: url });
try {
  const { rows } = await pool.query(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename",
  );
  console.log("Before:", rows.map((r) => r.tablename).join(", ") || "(empty)");
  await pool.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
  console.log("Neon public schema reset.");
} finally {
  await pool.end();
}
