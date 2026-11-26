import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate as migrateNeon } from "drizzle-orm/neon-http/migrator";
import { migrate as migrateNode } from "drizzle-orm/node-postgres/migrator";
import { readFileSync } from "node:fs";

import { isLocalPostgres } from "./index";
import { createLocalDb } from "./local";
import { schema } from "./schema";

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

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run migrations");
}

if (isLocalPostgres(databaseUrl)) {
  const db = createLocalDb(databaseUrl);
  await migrateNode(db, { migrationsFolder: "./drizzle" });
  console.log("Migration complete (node-postgres).");
} else {
  const sql = neon(databaseUrl);
  const db = drizzle({ client: sql, schema });
  await migrateNeon(db, { migrationsFolder: "./drizzle" });
  console.log("Migration complete (neon-http).");
}
