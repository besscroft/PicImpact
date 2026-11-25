import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
import { type Context, type Next } from "hono";

import { BackupValidationError, parseBackupEnvelope } from "./backup/format";
import type { ObjectStorage } from "./storage";
import type { ResolvedStorage } from "./storage-config";
import type { PicImpactStore } from "./store";
import { exportBackup, importBackup } from "./store";

type AuthHandler = {
  handler(request: Request): Response | Promise<Response>;
  api: {
    getSession(input: { headers: Headers }): Promise<unknown>;
  };
};

const photoInputSchema = z.object({
  id: z.string().min(1),
  image_name: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  preview_url: z.string().nullable().optional(),
  video_url: z.string().nullable().optional(),
  blurhash: z.string().nullable().optional(),
  exif: z.any().nullable().optional(),
  labels: z.any().nullable().optional(),
  width: z.number().int().nonnegative().optional(),
  height: z.number().int().nonnegative().optional(),
  lon: z.string().nullable().optional(),
  lat: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  detail: z.string().nullable().optional(),
  type: z.number().int().optional(),
  show: z.number().int().optional(),
  show_on_mainpage: z.number().int().optional(),
  sort: z.number().int().optional(),
  del: z.number().int().optional(),
});

const albumInputSchema = z.object({
  album_value: z.string().min(1),
  name: z.string().min(1),
  detail: z.string().nullable().optional(),
  theme: z.string().optional(),
  show: z.number().int().optional(),
  sort: z.number().int().optional(),
  random_show: z.number().int().optional(),
  license: z.string().nullable().optional(),
  image_sorting: z.number().int().optional(),
  daily_weight: z.number().int().optional(),
  del: z.number().int().optional(),
});

const configInputSchema = z.object({
  config_key: z.string().min(1),
  config_value: z.string().nullable().optional(),
  detail: z.string().nullable().optional(),
});

function jsonError(message: string, status = 400, details?: unknown) {
  return {
    code: status,
    message,
    ...(details === undefined ? {} : { details }),
  };
}

function parseBody<T>(schema: z.ZodType<T>, value: unknown) {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new HTTPInputError("Invalid request body", result.error.flatten());
  }
  return result.data;
}

class HTTPInputError extends Error {
  constructor(
    message: string,
    readonly details: unknown,
  ) {
    super(message);
    this.name = "HTTPInputError";
  }
}

export function createApp(options: {
  store: PicImpactStore;
  auth?: AuthHandler;
  storage?: ObjectStorage;
  maxUploadBytes?: number;
  storageResolver?: () => Promise<ResolvedStorage>;
}) {
  const app = new Hono();
  const resolveStorage = async () =>
    options.storageResolver?.() ?? {
      storage: options.storage ?? null,
      maxUploadBytes: options.maxUploadBytes ?? 25 * 1024 * 1024,
    };
  app.use(
    "/api/*",
    cors({
      origin: "*",
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    }),
  );

  app.on(["GET", "POST"], "/api/auth/*", (c) => {
    if (!options.auth) {
      return c.json(jsonError("Authentication requires DATABASE_URL", 503), 503);
    }
    return options.auth.handler(c.req.raw);
  });

  const requireAuth = async (c: Context, next: Next) => {
    if (!options.auth) {
      await next();
      return;
    }
    const session = await options.auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) {
      c.res = c.json(jsonError("Authentication required", 401), 401);
      return;
    }
    await next();
  };

  app.use("/api/photos", requireAuth);
  app.use("/api/photos/*", requireAuth);
  app.use("/api/albums", requireAuth);
  app.use("/api/albums/*", requireAuth);
  app.use("/api/config", requireAuth);
  app.use("/api/config/*", requireAuth);
  app.use("/api/backup", requireAuth);
  app.use("/api/backup/*", requireAuth);

  app.get("/api/session", async (c) => {
    if (!options.auth) {
      return c.json({ configured: false, authenticated: true, session: null });
    }
    const session = await options.auth.api.getSession({ headers: c.req.raw.headers });
    return c.json({
      configured: true,
      authenticated: Boolean(session),
      session,
    });
  });

  app.get("/api/health", (c) =>
    c.json({
      ok: true,
      app: "picimpact-web",
      version: "4.0.0",
      storage: options.store.getSource(),
    }),
  );

  app.get("/api/photos", async (c) =>
    c.json({
      data: await options.store.listImages(),
    }),
  );

  app.post("/api/photos", async (c) => {
    const input = parseBody(photoInputSchema, await c.req.json().catch(() => null));
    return c.json({ data: await options.store.upsertImage(input) }, 201);
  });

  app.post("/api/photos/upload", async (c) => {
    const { storage, maxUploadBytes } = await resolveStorage();
    if (!storage) {
      return c.json(jsonError("Object storage is not configured", 503), 503);
    }
    const formData = await c.req.raw.formData().catch(() => null);
    const file = formData?.get("file");
    if (!(file instanceof File)) {
      return c.json(jsonError("Upload a file in the `file` field"), 400);
    }
    if (file.size <= 0 || file.size > maxUploadBytes) {
      return c.json(jsonError(`File size must be between 1 and ${maxUploadBytes} bytes`), 400);
    }
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      return c.json(jsonError("Only image and video files are supported"), 400);
    }
    const key = createUploadKey(file.name);
    const body = await file.arrayBuffer();
    await storage.put({
      key,
      body,
      contentType: file.type || "application/octet-stream",
      contentLength: file.size,
    });
    const origin = new URL(c.req.url).origin;
    const url = storage.url(key, origin);
    const photo = await options.store.upsertImage({
      id: crypto.randomUUID(),
      image_name: file.name,
      url,
      preview_url: url,
      video_url: file.type.startsWith("video/") ? url : null,
      image_key: key,
      type: file.type.startsWith("video/") ? 2 : 1,
      title: stringField(formData?.get("title")),
      detail: stringField(formData?.get("detail")),
    });
    return c.json({ data: photo, object: { key, url, contentType: file.type } }, 201);
  });

  app.get("/api/storage/*", async (c) => {
    const { storage } = await resolveStorage();
    if (!storage) return c.json(jsonError("Object storage is not configured", 503), 503);
    const path = new URL(c.req.url).pathname.replace(/^\/api\/storage\//, "");
    const key = path
      .split("/")
      .map((segment) => decodeURIComponent(segment))
      .join("/");
    const object = await storage.get(key);
    if (!object) return c.json(jsonError("Object not found", 404), 404);
    return new Response(object.body as unknown as BodyInit, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": object.contentType,
      },
    });
  });

  app.get("/api/albums", async (c) =>
    c.json({
      data: await options.store.listAlbums(),
    }),
  );

  app.post("/api/albums", async (c) => {
    const input = parseBody(albumInputSchema, await c.req.json().catch(() => null));
    return c.json({ data: await options.store.upsertAlbum(input) }, 201);
  });

  app.get("/api/config", async (c) =>
    c.json({
      data: await options.store.listConfigs(),
    }),
  );

  app.put("/api/config", async (c) => {
    const input = parseBody(configInputSchema, await c.req.json().catch(() => null));
    return c.json({ data: await options.store.upsertConfig(input) });
  });

  app.get("/api/backup/export", async () => {
    const envelope = await exportBackup(options.store);
    const filename = `picimpact-backup-v1-${new Date().toISOString().replaceAll(":", "-")}.json`;
    return new Response(JSON.stringify(envelope, null, 2), {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  });

  app.post("/api/backup/import/preview", async (c) => {
    const input = await c.req.json().catch(() => null);
    try {
      return c.json({ data: parseBackupEnvelope(input).preview });
    } catch (error) {
      if (error instanceof BackupValidationError) {
        return c.json(jsonError(error.message, 400, error.preview), 400);
      }
      throw error;
    }
  });

  app.post("/api/backup/import", async (c) => {
    const input = await c.req.json().catch(() => null);
    try {
      return c.json({ data: await importBackup(options.store, input) });
    } catch (error) {
      if (error instanceof BackupValidationError) {
        return c.json(jsonError(error.message, 400, error.preview), 400);
      }
      throw error;
    }
  });

  app.notFound((c) => c.json(jsonError("Not found", 404), 404));
  app.onError((error, c) => {
    if (error instanceof HTTPInputError) {
      return c.json(jsonError(error.message, 400, error.details), 400);
    }
    console.error(error);
    return c.json(jsonError("Internal server error", 500), 500);
  });
  return app;
}

function stringField(value: FormDataEntryValue | null | undefined) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function createUploadKey(fileName: string) {
  const safeName =
    fileName
      .normalize("NFKD")
      .replace(/[^\w.-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 100) || "upload";
  return `photos/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeName}`;
}
