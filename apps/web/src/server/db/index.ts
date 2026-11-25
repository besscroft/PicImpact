import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import { schema } from "./schema";

export function createNeonDb(databaseUrl: string) {
  return drizzle({
    client: neon(databaseUrl),
    schema,
  });
}

export type Database = ReturnType<typeof createNeonDb>;
