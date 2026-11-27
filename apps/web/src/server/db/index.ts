import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import type { Client, Pool } from "pg";

import { schema } from "./schema";

export function createPostgresDb(client: Client | Pool): Database {
  return drizzle({ client, schema });
}

export type Database = NodePgDatabase<typeof schema>;
