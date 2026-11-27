import { getRequestListener } from "@hono/node-server";
import { readFileSync } from "node:fs";
import solid from "@solidjs/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite-plus";

import { createApp } from "./src/server/app";
import { createAuth } from "./src/server/auth";
import { createPostgresDb } from "./src/server/db";
import { createPostgresPool } from "./src/server/db/pool";
import { DrizzlePicImpactStore } from "./src/server/store";
import { createStorageResolver } from "./src/server/storage-config";
import { S3ObjectStorage } from "./src/server/storage-s3";

// Vite 不会把 .env 注入 process.env，这里手动加载供 API 中间件使用
loadDotEnv();

function loadDotEnv() {
  try {
    const content = readFileSync(new URL("./.env", import.meta.url), "utf8");
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
}

function apiMiddleware() {
  return {
    name: "picimpact-api",
    configureServer(server: {
      middlewares: {
        use: (handler: (request: any, response: any, next: () => void) => void) => void;
      };
    }) {
      if (process.env.VITEST) {
        // Vitest 会复用 vite.config 创建独立服务器，单测自建 Hono app，无需 API 中间件
        return;
      }
      const db = createPostgresDb(createPostgresPool(process.env.DATABASE_URL));
      const store = new DrizzlePicImpactStore(db);
      const app = createApp({
        store,
        auth: createAuth(db, {
          baseURL: process.env.BETTER_AUTH_URL,
          secret: process.env.BETTER_AUTH_SECRET,
        }),
        storageResolver: createStorageResolver(store, {
          createS3: (options) => new S3ObjectStorage(options),
        }),
      });
      const listener = getRequestListener(app.fetch);
      server.middlewares.use((request, response, next) => {
        if (!request.url?.startsWith("/api/")) {
          next();
          return;
        }
        void listener(request, response);
      });
    },
  };
}

export default defineConfig({
  plugins: [tailwindcss(), solid(), apiMiddleware()],
  optimizeDeps: {
    exclude: ["@ui-sdk/core"],
  },
  server: {
    port: 5173,
  },
  build: {
    target: "es2022",
  },
});
