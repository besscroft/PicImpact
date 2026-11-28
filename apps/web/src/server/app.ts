import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
import { type Context, type Next } from "hono";

import { isStorageProvider, type StorageProvider } from "../storage-provider";
import { BackupValidationError, parseBackupEnvelope } from "./backup/format";
import type { BackupJsonValue } from "./backup/types";
import { encodePath, StorageWriteDeniedError, type ObjectStorage } from "./storage";
import type { StorageResolver } from "./storage-config";
import type { PicImpactStore } from "./store";
import { exportBackup, importBackup } from "./store";

type AuthHandler = {
  handler(request: Request): Response | Promise<Response>;
  isRegistrationOpen(): Promise<boolean>;
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
  image_key: z.string().nullable().optional(),
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
const photoUpdateSchema = photoInputSchema.omit({ id: true }).partial();

const albumBindSchema = z.object({
  album_value: z.string().min(1),
});

const albumShowSchema = z.object({
  show: z.number().int().min(0).max(1),
});

const batchDeleteSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
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

const STORAGE_CONFIG_KEYS = [
  "storage.endpoint",
  "storage.region",
  "storage.bucket",
  "storage.access_key_id",
  "storage.secret_access_key",
  "storage.force_path_style",
  "storage.public_url",
  "storage.storage_folder",
  "storage.r2.account_id",
  "storage.r2.access_key_id",
  "storage.r2.secret_access_key",
  "storage.r2.bucket",
  "storage.r2.storage_folder",
  "storage.r2.public_url",
  "storage.direct_download",
  "storage.r2.direct_download",
] as const;

// 站点展示配置（对齐 v3 的 configs key：custom_title / custom_favicon_url / custom_author / umami_*）
const SITE_CONFIG_KEYS = {
  title: "custom_title",
  faviconUrl: "custom_favicon_url",
  author: "custom_author",
  umamiHost: "umami_host",
  umamiAnalytics: "umami_analytics",
} as const;

const DEFAULT_SITE_TITLE = "PicImpact";

const siteConfigSchema = z
  .object({
    title: z.string().trim().max(100).optional(),
    faviconUrl: z.union([z.literal(""), z.string().trim().url()]).optional(),
    author: z.string().trim().max(100).optional(),
    umamiHost: z.union([z.literal(""), z.string().trim().url()]).optional(),
    umamiAnalytics: z.string().trim().max(200).optional(),
  })
  .refine((input) => Object.keys(input).length > 0, { message: "至少提供一个配置项" });

const STORAGE_CONFIG_KEY_SET = new Set<string>(STORAGE_CONFIG_KEYS);

const storageConfigSchema = z.record(z.string(), z.string());

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
  storageResolver?: StorageResolver;
}) {
  const app = new Hono();
  const resolveStorage: StorageResolver = async (provider) =>
    options.storageResolver?.(provider) ?? {
      storage: options.storage ?? null,
      maxUploadBytes: options.maxUploadBytes ?? 25 * 1024 * 1024,
      storageFolder: "",
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
  app.use("/api/storage-config", requireAuth);
  app.use("/api/storage-config/*", requireAuth);
  app.use("/api/site", requireAuth);
  app.use("/api/site/*", requireAuth);
  app.use("/api/backup", requireAuth);
  app.use("/api/backup/*", requireAuth);
  app.use("/api/admin", requireAuth);
  app.use("/api/admin/*", requireAuth);

  app.get("/api/session", async (c) => {
    c.header("Cache-Control", "no-store");
    if (!options.auth) {
      return c.json({
        configured: false,
        authenticated: true,
        registrationOpen: false,
        session: null,
      });
    }
    const session = await options.auth.api.getSession({ headers: c.req.raw.headers });
    return c.json({
      configured: true,
      authenticated: Boolean(session),
      registrationOpen: await options.auth.isRegistrationOpen(),
      session,
    });
  });

  /**
   * GET /api/public/site
   *
   * 公开端站点展示配置：网站标题 / favicon / 作者 / Umami 统计。
   * 前端启动时读取并应用到 document.title、favicon 与 Umami 脚本注入。
   */
  app.get("/api/public/site", async (c) => {
    c.header("Cache-Control", "public, max-age=60");
    return c.json({ data: await readSiteConfig(options.store) });
  });

  app.get("/api/health", (c) =>
    c.json({
      ok: true,
      app: "picimpact-web",
      version: "4.0.0",
      storage: options.store.getSource(),
    }),
  );

  app.get("/api/public/albums", async (c) =>
    c.json({
      data: await options.store.listPublicAlbums(),
    }),
  );

  app.get("/api/public/images", async (c) => {
    const page = Number(c.req.query("page") ?? 1);
    const pageSize = Number(c.req.query("pageSize") ?? c.req.query("limit") ?? 24);
    const album = c.req.query("album") ?? "/";
    return c.json(await options.store.listPublicImages({ album, page, pageSize }));
  });

  app.get("/api/public/images/:id", async (c) => {
    const id = c.req.param("id");
    const image = await options.store.getPublicImage(id);
    if (!image) return c.json(jsonError("Image not found", 404), 404);
    const neighbors = await options.store.getPublicImageNeighbors(id, image.album_value ?? "/");
    return c.json({ data: image, neighbors });
  });

  /**
   * GET /api/public/download/config
   *
   * 对齐 v3 的 direct-download 业务：返回 S3/R2 各自的直链下载开关，
   * 每个标志 = 配置开关开启 && 当前存储实现支持 presign（R2 binding 不支持时
   * 前端自动回落到代理下载）。driver 作为前端缺省 storage 参数。
   */
  app.get("/api/public/download/config", async (c) => {
    const configs = await options.store.listConfigs();
    const values = new Map(configs.map((row) => [row.config_key, row.config_value ?? ""]));
    const presignSupported = async (provider: StorageProvider) => {
      const { storage } = await resolveStorage(provider);
      return typeof storage?.presignedGetUrl === "function";
    };
    c.header("Cache-Control", "private, max-age=60");
    return c.json({
      data: {
        s3DirectDownload:
          values.get("storage.direct_download") === "true" && (await presignSupported("s3")),
        r2DirectDownload:
          values.get("storage.r2.direct_download") === "true" && (await presignSupported("r2")),
        driver: values.get("storage.driver") || "",
      },
    });
  });

  app.get("/api/public/download/:id/presigned", async (c) => {
    const selection = c.req.query("storage");
    if (selection !== undefined && !isStorageProvider(selection)) {
      return c.json(jsonError("Unsupported storage type", 400), 400);
    }
    const { storage, storageFolder } = await resolveStorage(selection);
    if (!storage?.presignedGetUrl) {
      return c.json(jsonError("Presigned download is not available for the current storage", 400), 400);
    }
    const image = await options.store.getPublicImage(c.req.param("id"));
    if (!image) return c.json(jsonError("Image not found", 404), 404);
    const key = downloadObjectKey(image, storageFolder);
    if (!key) return c.json(jsonError("Image URL not found", 404), 404);
    const url = await storage.presignedGetUrl(key);
    c.header("Cache-Control", "private, max-age=60");
    return c.json({
      data: { url, filename: deriveDownloadFilename(image.image_name, image.url) },
    });
  });

  app.get("/api/public/download/:id", async (c) => {
    const selection = c.req.query("storage");
    if (selection !== undefined && !isStorageProvider(selection)) {
      return c.json(jsonError("Unsupported storage type", 400), 400);
    }
    const { storage, storageFolder } = await resolveStorage(selection);
    if (!storage) return c.json(jsonError("Object storage is not configured", 503), 503);
    const image = await options.store.getPublicImage(c.req.param("id"));
    if (!image) return c.json(jsonError("Image not found", 404), 404);
    const key = downloadObjectKey(image, storageFolder);
    if (!key) return c.json(jsonError("Image URL not found", 404), 404);
    const object = await storage.get(key);
    if (!object) return c.json(jsonError("Object not found", 404), 404);
    return new Response(object.body as unknown as BodyInit, {
      headers: {
        "Content-Type": object.contentType,
        "Content-Disposition": buildContentDisposition(
          deriveDownloadFilename(image.image_name, image.url),
        ),
        "Cache-Control": "private, no-store",
      },
    });
  });

  app.get("/api/admin/dashboard", async (c) =>
    c.json({
      data: await options.store.getDashboard(),
    }),
  );

  app.get("/api/photos", async (c) => {
    const query = c.req.query();
    const page = await options.store.listAdminImages({
      album: query.album,
      show: query.show === undefined || query.show === "" ? undefined : Number(query.show),
      camera: query.camera,
      lens: query.lens,
      page: query.page ? Number(query.page) : undefined,
      pageSize: query.pageSize ? Number(query.pageSize) : undefined,
    });
    return c.json({
      data: page.data,
      page: page.page,
      pageSize: page.pageSize,
      total: page.total,
      pages: page.pages,
    });
  });

  app.get("/api/photos/camera-lens-list", async (c) => {
    const images = await options.store.listImages();
    const cameras = new Set<string>();
    const lenses = new Set<string>();
    for (const image of images) {
      if (image.del !== 0) continue;
      const exif =
        image.exif && typeof image.exif === "object" && !Array.isArray(image.exif)
          ? (image.exif as Record<string, unknown>)
          : null;
      const model = typeof exif?.model === "string" && exif.model.trim() ? exif.model.trim() : null;
      const lensModel =
        typeof exif?.lens_model === "string" && exif.lens_model.trim() ? exif.lens_model.trim() : null;
      if (model) cameras.add(model);
      if (lensModel) lenses.add(lensModel);
    }
    return c.json({
      data: { cameras: [...cameras].sort(), lenses: [...lenses].sort() },
    });
  });

  app.post("/api/photos/batch-delete", async (c) => {
    const input = parseBody(batchDeleteSchema, await c.req.json().catch(() => null));
    const deleted = await options.store.deleteImages(input.ids);
    return c.json({ data: { deleted } });
  });

  app.post("/api/photos", async (c) => {
    const input = parseBody(photoInputSchema, await c.req.json().catch(() => null));
    return c.json({ data: await options.store.upsertImage(input) }, 201);
  });

  app.put("/api/photos/:id", async (c) => {
    const id = c.req.param("id");
    const existing = (await options.store.listImages()).find((photo) => photo.id === id);
    if (!existing) return c.json(jsonError("Image not found", 404), 404);
    const input = parseBody(photoUpdateSchema, await c.req.json().catch(() => null));
    return c.json({ data: await options.store.upsertImage({ ...existing, ...input, id }) });
  });

  app.put("/api/photos/:id/album", async (c) => {
    const id = c.req.param("id");
    const existing = (await options.store.listImages()).find(
      (photo) => photo.id === id && photo.del === 0,
    );
    if (!existing) return c.json(jsonError("Image not found", 404), 404);
    const input = parseBody(albumBindSchema, await c.req.json().catch(() => null));
    await options.store.setImageAlbum(id, input.album_value);
    return c.json({ data: { updated: true } });
  });

  app.delete("/api/photos/:id", async (c) => {
    const deleted = await options.store.deleteImage(c.req.param("id"));
    if (!deleted) return c.json(jsonError("Image not found", 404), 404);
    return c.json({ data: { deleted: true } });
  });

  app.post("/api/photos/upload", async (c) => {
    const formData = await c.req.raw.formData().catch(() => null);
    const file = formData?.get("file");
    if (!(file instanceof File)) {
      return c.json(jsonError("Upload a file in the `file` field"), 400);
    }
    const selection = formData?.get("storage") ?? undefined;
    if (selection !== undefined && !isStorageProvider(selection)) {
      return c.json(jsonError("不支持所选的存储类型"), 400);
    }
    const { storage, maxUploadBytes, storageFolder } = await resolveStorage(selection);
    if (!storage) {
      return c.json(jsonError(selection ? "所选存储尚未配置，请在存储配置中设置后重试。" : "Object storage is not configured", 503), 503);
    }
    if (file.size <= 0 || file.size > maxUploadBytes) {
      return c.json(jsonError(`File size must be between 1 and ${maxUploadBytes} bytes`), 400);
    }
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      return c.json(jsonError("Only image and video files are supported"), 400);
    }
    const key = createUploadKey(file.name, undefined, storageFolder);
    const body = await file.arrayBuffer();
    await storage.put({
      key,
      body,
      contentType: file.type || "application/octet-stream",
      contentLength: file.size,
    });
    const origin = new URL(c.req.url).origin;
    const url = uploadObjectUrl(storage, key, origin, selection);

    // Optional compressed preview image produced on the client (v3 behavior).
    let previewUrl = url;
    const previewFile = formData?.get("preview");
    if (previewFile instanceof File && previewFile.size > 0 && previewFile.size <= maxUploadBytes) {
      const previewKey = createUploadKey(previewFile.name, "preview", storageFolder);
      await storage.put({
        key: previewKey,
        body: await previewFile.arrayBuffer(),
        contentType: previewFile.type || "image/webp",
        contentLength: previewFile.size,
      });
      previewUrl = uploadObjectUrl(storage, previewKey, origin, selection);
    }

    const isVideo = file.type.startsWith("video/");

    // persist=0 时仅上传到对象存储，不入库；由客户端拿到对象信息后按需调用 /api/photos 保存
    if (stringField(formData?.get("persist")) === "0") {
      return c.json(
        { object: { key, url, previewUrl, contentType: file.type, isVideo } },
        201,
      );
    }

    const photo = await options.store.upsertImage({
      id: crypto.randomUUID(),
      image_name: file.name,
      url,
      preview_url: previewUrl,
      video_url: isVideo ? url : null,
      image_key: key,
      type: isVideo ? 2 : 1,
      title: stringField(formData?.get("title")),
      detail: stringField(formData?.get("detail")),
      width: numberField(formData?.get("width")) ?? 0,
      height: numberField(formData?.get("height")) ?? 0,
      lat: stringField(formData?.get("lat")),
      lon: stringField(formData?.get("lon")),
      blurhash: stringField(formData?.get("blurhash")),
      exif: jsonField(formData?.get("exif")) as BackupJsonValue | null,
      labels: jsonField(formData?.get("labels")) as BackupJsonValue | null,
    });
    const album = stringField(formData?.get("album"));
    if (album) {
      await options.store.setImageAlbum(photo.id, album);
    }
    return c.json({ data: photo, object: { key, url, contentType: file.type } }, 201);
  });

  app.get("/api/storage/*", async (c) => {
    const selection = c.req.query("storage");
    if (selection !== undefined && !isStorageProvider(selection)) {
      return c.json(jsonError("Unsupported storage type"), 400);
    }
    const { storage } = await resolveStorage(selection);
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
      data: await options.store.listAdminAlbums(),
    }),
  );

  app.post("/api/albums", async (c) => {
    const input = parseBody(albumInputSchema, await c.req.json().catch(() => null));
    if (!input.album_value.startsWith("/")) {
      return c.json(jsonError("The route must start with /"), 400);
    }
    return c.json({ data: await options.store.upsertAlbum(input) }, 201);
  });

  app.put("/api/albums/:id", async (c) => {
    const id = c.req.param("id");
    const input = parseBody(albumInputSchema, await c.req.json().catch(() => null));
    if (!input.album_value.startsWith("/")) {
      return c.json(jsonError("The route must start with /"), 400);
    }
    const album = await options.store.updateAlbum(id, input);
    if (!album) return c.json(jsonError("Album not found", 404), 404);
    return c.json({ data: album });
  });

  app.put("/api/albums/:id/show", async (c) => {
    const id = c.req.param("id");
    const input = parseBody(albumShowSchema, await c.req.json().catch(() => null));
    await options.store.updateAlbumShow(id, input.show);
    return c.json({ data: { updated: true } });
  });

  app.delete("/api/albums/:id", async (c) => {
    const deleted = await options.store.deleteAlbum(c.req.param("id"));
    if (!deleted) return c.json(jsonError("Album not found", 404), 404);
    return c.json({ data: { deleted: true } });
  });

  app.get("/api/config", async (c) =>
    c.json({
      data: await options.store.listConfigs(),
    }),
  );

  app.get("/api/site", async (c) =>
    c.json({ data: await readSiteConfig(options.store) }),
  );

  app.put("/api/site", async (c) => {
    const input = parseBody(siteConfigSchema, await c.req.json().catch(() => null));
    const saved = await Promise.all(
      Object.entries(SITE_CONFIG_KEYS)
        .filter(([field]) => input[field as keyof typeof input] !== undefined)
        .map(([field, key]) => {
          const value = input[field as keyof typeof input];
          // 空字符串表示清空配置，存储为 null
          return options.store.upsertConfig({
            config_key: key,
            config_value: value ? value : null,
          });
        }),
    );
    return c.json({ data: await readSiteConfig(options.store), saved });
  });

  app.get("/api/storage-config", async (c) => {
    const configs = await options.store.listConfigs();
    const values = new Map(configs.map((row) => [row.config_key, row.config_value ?? ""]));
    const data = Object.fromEntries(
      STORAGE_CONFIG_KEYS.map((key) => [key, values.get(key) ?? ""]),
    );
    return c.json({ data });
  });

  app.put("/api/storage-config", async (c) => {
    const input = parseBody(storageConfigSchema, await c.req.json().catch(() => null));
    const saved = await Promise.all(
      Object.entries(input)
        .filter(([key]) => STORAGE_CONFIG_KEY_SET.has(key))
        .map(([key, value]) => {
          const trimmed = value.trim();
          return options.store.upsertConfig({
            config_key: key,
            config_value: trimmed ? trimmed : null,
          });
        }),
    );
    return c.json({ data: saved });
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
    if (error instanceof StorageWriteDeniedError) {
      return c.json(jsonError(error.message, 502), 502);
    }
    console.error(error);
    return c.json(jsonError("Internal server error", 500), 500);
  });
  return app;
}

function stringField(value: FormDataEntryValue | null | undefined) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

type SiteConfig = {
  title: string;
  faviconUrl: string;
  author: string;
  umamiHost: string;
  umamiAnalytics: string;
};

/** 读取站点展示配置，空值回落到默认标题 PicImpact（favicon/umami 留空表示未配置）。 */
async function readSiteConfig(store: PicImpactStore): Promise<SiteConfig> {
  const rows = await store.listConfigs();
  const values = new Map(rows.map((row) => [row.config_key, row.config_value ?? ""]));
  const value = (key: string) => values.get(key) ?? "";
  return {
    title: value(SITE_CONFIG_KEYS.title) || DEFAULT_SITE_TITLE,
    faviconUrl: value(SITE_CONFIG_KEYS.faviconUrl),
    author: value(SITE_CONFIG_KEYS.author),
    umamiHost: value(SITE_CONFIG_KEYS.umamiHost),
    umamiAnalytics: value(SITE_CONFIG_KEYS.umamiAnalytics),
  };
}

function numberField(value: FormDataEntryValue | null | undefined) {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function jsonField(value: FormDataEntryValue | null | undefined) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function uploadObjectUrl(storage: ObjectStorage, key: string, origin: string, provider?: StorageProvider) {
  const url = storage.url(key, origin);
  return provider && url === `${origin}/api/storage/${encodePath(key)}`
    ? `${url}?storage=${provider}`
    : url;
}

function createUploadKey(fileName: string, kind?: "preview", folderPrefix?: string) {
  const safeName =
    fileName
      .normalize("NFKD")
      .replace(/[^\w.-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 100) || "upload";
  const prefix = kind === "preview" ? "photos/preview" : "photos";
  const path = `${prefix}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeName}`;
  return folderPrefix ? `${folderPrefix}/${path}` : path;
}

/** 从图片记录推导下载对象 key：image_key 优先，否则从 url 剥离 scheme/host 与代理前缀。 */
function downloadObjectKey(
  image: { image_key?: string | null; url?: string | null },
  storageFolder: string,
) {
  const raw = image.image_key || deriveKeyFromUrl(image.url ?? null);
  if (!raw) return null;
  const stripped =
    storageFolder && raw.startsWith(`${storageFolder}/`) ? raw.slice(storageFolder.length + 1) : raw;
  return storageFolder ? `${storageFolder}/${stripped}` : stripped;
}

function deriveKeyFromUrl(url: string | null): string | null {
  if (!url) return null;
  let key = url.split("?")[0];
  if (/^https?:\/\//i.test(key)) {
    const match = key.match(/^https?:\/\/[^/]+(\/.*)$/);
    if (!match) return null;
    key = match[1].slice(1);
    if (key.startsWith("api/storage/")) key = key.slice("api/storage/".length);
  }
  return key
    .split("/")
    .map((segment) => {
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    })
    .join("/");
}

/** v3 的 deriveFilename：image_name 优先，否则取 url 尾段。 */
function deriveDownloadFilename(imageName: string | null | undefined, url: string | null | undefined) {
  if (imageName) return imageName;
  const tail = (url ?? "").split("?")[0].split("/").pop() || "download.jpg";
  try {
    return decodeURIComponent(tail);
  } catch {
    return tail;
  }
}

function buildContentDisposition(filename: string) {
  const encoded = encodeURIComponent(filename);
  // 引号部分只能是 ByteString（Latin-1），非 ASCII 字符替换后用 filename* 携带真实名
  const asciiFallback = filename.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_") || "download";
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
}
