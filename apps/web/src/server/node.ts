import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";

import { createApp } from "./app";
import { createAuth } from "./auth";
import { createPostgresDb } from "./db";
import { createPostgresPool } from "./db/pool";
import { DrizzlePicImpactStore } from "./store";
import { createStorageResolver } from "./storage-config";
import { S3ObjectStorage } from "./storage-s3";

const db = createPostgresDb(createPostgresPool(process.env.DATABASE_URL));
const store = new DrizzlePicImpactStore(db);
const auth = createAuth(db, {
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
});
const app = createApp({
  store,
  auth,
  storageResolver: createStorageResolver(store, {
    createS3: (options) => new S3ObjectStorage(options),
  }),
});

app.get("*", (c, next) => {
  if (c.req.path.startsWith("/api/")) return next();
  if (c.req.path !== "/" && c.req.path.includes(".")) {
    return serveStatic({ root: "./dist/client" })(c, next);
  }
  return serveStatic({
    root: "./dist/client",
    rewriteRequestPath: () => "/index.html",
  })(c, next);
});

if (process.env.NODE_ENV !== "test") {
  serve(
    {
      fetch: app.fetch,
      port: Number(process.env.PORT ?? 8787),
    },
    (info) => {
      console.log(`PicImpact web listening on http://localhost:${info.port}`);
    },
  );
}

export default app;
