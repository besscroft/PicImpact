import type { R2Bucket } from "@cloudflare/workers-types";
import { Client } from "pg";

import { createApp } from "./app";
import { createAuth } from "./auth";
import { createPostgresDb } from "./db";
import { DrizzlePicImpactStore } from "./store";
import { S3FetchObjectStorage } from "./storage-s3-fetch";
import { createStorageResolver } from "./storage-config";

type Env = {
  HYPERDRIVE?: Pick<Hyperdrive, "connectionString">;
  DATABASE_URL?: string;
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  ASSETS?: Fetcher;
  R2?: R2Bucket;
};

export default {
  async fetch(request: Request, env: Env, executionContext: ExecutionContext) {
    const path = new URL(request.url).pathname;
    if (path !== "/api" && !path.startsWith("/api/")) {
      return env.ASSETS?.fetch(request) ?? new Response("Not found", { status: 404 });
    }

    const connectionString = env.HYPERDRIVE?.connectionString ?? env.DATABASE_URL;
    if (!connectionString) {
      return Response.json(
        { code: 503, message: "Configure HYPERDRIVE or DATABASE_URL" },
        { status: 503 },
      );
    }

    const client = new Client({ connectionString, connectionTimeoutMillis: 10_000 });
    client.on("error", () => console.error("The Worker PostgreSQL connection failed."));
    try {
      try {
        await client.connect();
      } catch (error) {
        console.error("Could not connect to PostgreSQL.", (error as { code?: string })?.code);
        return Response.json({ code: 503, message: "PostgreSQL is unavailable" }, { status: 503 });
      }

      const db = createPostgresDb(client);
      const store = new DrizzlePicImpactStore(db);
      const app = createApp({
        store,
        auth: createAuth(db, { baseURL: env.BETTER_AUTH_URL, secret: env.BETTER_AUTH_SECRET }),
        storageResolver: createStorageResolver(store, {
          r2: env.R2,
          createS3: (options) => new S3FetchObjectStorage(options),
        }),
      });
      return await app.fetch(request, env, executionContext);
    } finally {
      executionContext.waitUntil(
        client
          .end()
          .catch(() => console.error("Could not close the Worker PostgreSQL connection.")),
      );
    }
  },
};
