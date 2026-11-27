import { migrate } from "drizzle-orm/node-postgres/migrator";
import { readFileSync } from "node:fs";

import { createPostgresDb } from "./index";
import { createPostgresPool } from "./pool";

// 手动加载 .env（与 vite.config.ts 行为一致）
try {
  const content = readFileSync(new URL("../../../.env", import.meta.url), "utf8");
  for (const line of content.split("\n")) {
    const match = /^\s*([\w.-]+)\s*=\s*(.*)?\s*$/.exec(line);
    if (!match) continue;
    const key = match[1];
    const value = (match[2] ?? "").trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
} catch {
  // .env 不存在时忽略
}

const pool = createPostgresPool(process.env.DATABASE_URL);
try {
  await migrate(createPostgresDb(pool), { migrationsFolder: "./drizzle" });
  console.log("Migration complete.");
} finally {
  await pool.end();
}
