import { Pool } from "pg";

export function createPostgresPool(databaseUrl: string | undefined) {
  if (!databaseUrl) {
    throw new Error(
      "Missing DATABASE_URL: configure a PostgreSQL connection string to run PicImpact.",
    );
  }
  const pool = new Pool({ connectionString: databaseUrl, connectionTimeoutMillis: 10_000 });
  pool.on("error", () => console.error("An idle PostgreSQL connection failed."));
  return pool;
}
