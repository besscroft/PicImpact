import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";

import { createApp } from "./app";
import { createAuth } from "./auth";
import { createNeonDb } from "./db";
import { createStore } from "./store";
import { createStorageResolver } from "./storage-config";
import { S3ObjectStorage } from "./storage-s3";

const env = {
  DATABASE_URL: process.env.DATABASE_URL,
};
const store = createStore(env);
const auth = env.DATABASE_URL
  ? createAuth(createNeonDb(env.DATABASE_URL), {
      baseURL: process.env.BETTER_AUTH_URL,
      secret: process.env.BETTER_AUTH_SECRET,
    })
  : undefined;
const app = createApp({
  store,
  auth,
  storageResolver: createStorageResolver(store, {
    createS3: (options) => new S3ObjectStorage(options),
  }),
});

app.get("*", serveStatic({ root: "./dist/client" }));

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
