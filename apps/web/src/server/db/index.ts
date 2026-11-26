import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { schema } from "./schema";

export function createNeonDb(databaseUrl: string) {
  return drizzle({
    client: neon(databaseUrl),
    schema,
  });
}

export function isLocalPostgres(databaseUrl: string) {
  try {
    const host = new URL(databaseUrl).hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch {
    return false;
  }
}

export type Database = NeonHttpDatabase<typeof schema> | NodePgDatabase<typeof schema>;
