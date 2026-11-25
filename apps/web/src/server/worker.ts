import type { R2Bucket } from "@cloudflare/workers-types";

import { createApp } from "./app";
import { createAuth } from "./auth";
import { createNeonDb } from "./db";
import { createStore, type StoreEnv } from "./store";
import { S3FetchObjectStorage } from "./storage-s3-fetch";
import { createStorageResolver } from "./storage-config";

type Env = StoreEnv & {
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  ASSETS?: Fetcher;
  R2?: R2Bucket;
};

let cachedApp: ReturnType<typeof createApp> | undefined;
let cachedDatabaseUrl: string | undefined;

function getApp(env: Env) {
  if (cachedApp && cachedDatabaseUrl === env.DATABASE_URL) {
    return cachedApp;
  }
  const store = createStore(env);
  const auth = env.DATABASE_URL
    ? createAuth(createNeonDb(env.DATABASE_URL), {
        baseURL: env.BETTER_AUTH_URL,
        secret: env.BETTER_AUTH_SECRET,
      })
    : undefined;
  cachedDatabaseUrl = env.DATABASE_URL;
  cachedApp = createApp({
    store,
    auth,
    storageResolver: createStorageResolver(store, {
      r2: env.R2,
      createS3: (options) => new S3FetchObjectStorage(options),
    }),
  });
  return cachedApp;
}

export default {
  fetch(request: Request, env: Env, executionContext: ExecutionContext) {
    return Promise.resolve(getApp(env).fetch(request, env, executionContext)).then(
      async (response) => {
        if (response.status === 404 && env.ASSETS) {
          return env.ASSETS.fetch(request);
        }
        return response;
      },
    );
  },
};
