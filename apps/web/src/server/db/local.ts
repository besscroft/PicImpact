import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { schema } from "./schema";

/**
 * 本地 Postgres 使用 node-postgres 驱动（Neon HTTP 驱动无法访问 localhost）。
 * 仅限 Node 运行时使用，Worker 打包不引用本模块。
 */
export function createLocalDb(databaseUrl: string) {
  return drizzle({ client: new Pool({ connectionString: databaseUrl }), schema });
}
