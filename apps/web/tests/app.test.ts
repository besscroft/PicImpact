import { describe, expect, it, vi } from "vite-plus/test";

import { createApp } from "../src/server/app";
import { MemoryPicImpactStore } from "../src/server/store";
import { MemoryObjectStorage } from "../src/server/storage";
import { schema } from "../src/server/db/schema";
import { createStorageResolver } from "../src/server/storage-config";
import { S3FetchObjectStorage } from "../src/server/storage-s3-fetch";

describe("PicImpact web API", () => {
  it("exposes health and module endpoints without a database", async () => {
    const app = createApp({ store: new MemoryPicImpactStore() });

    const health = await app.request("http://localhost/api/health");
    expect(health.status).toBe(200);
    expect(await health.json()).toMatchObject({
      ok: true,
      storage: { orm: "drizzle", database: "postgresql" },
    });

    const config = await app.request("http://localhost/api/config");
    expect(config.status).toBe(200);
    expect(await config.json()).toEqual({ data: [] });
  });

  it("writes configuration and returns it through the same store", async () => {
    const app = createApp({ store: new MemoryPicImpactStore() });

    const save = await app.request("http://localhost/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        config_key: "site_title",
        config_value: "PicImpact",
      }),
    });
    expect(save.status).toBe(200);

    const list = await app.request("http://localhost/api/config");
    expect(await list.json()).toEqual({
      data: [
        expect.objectContaining({
          config_key: "site_title",
          config_value: "PicImpact",
        }),
      ],
    });
  });

  it("imports a valid v3 backup through the Hono route", async () => {
    const app = createApp({ store: new MemoryPicImpactStore() });
    const response = await app.request("http://localhost/api/backup/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        format: "picimpact-backup",
        version: 1,
        exportedAt: "2026-11-24T00:00:00.000Z",
        source: { orm: "prisma", database: "postgresql" },
        payload: {
          configs: [],
          albums: [],
          images: [],
          imageAlbumRelations: [],
        },
      }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      data: {
        format: "picimpact-backup",
        version: 1,
        counts: { configs: 0, albums: 0, images: 0, imageAlbumRelations: 0 },
      },
    });
  });

  it("uploads an image to the configured object storage and serves it back", async () => {
    const app = createApp({
      store: new MemoryPicImpactStore(),
      storage: new MemoryObjectStorage(),
    });
    const form = new FormData();
    form.set(
      "file",
      new File([new Uint8Array([1, 2, 3])], "sample.jpg", {
        type: "image/jpeg",
      }),
    );
    form.set("title", "Sample");

    const upload = await app.request("http://localhost/api/photos/upload", {
      method: "POST",
      body: form,
    });
    expect(upload.status).toBe(201);
    const uploadBody = (await upload.json()) as {
      object: { url: string };
      data: { title: string | null };
    };
    expect(uploadBody.data.title).toBe("Sample");
    expect(uploadBody.object.url).toContain("/api/storage/photos/");

    const stored = await app.request(`http://localhost${new URL(uploadBody.object.url).pathname}`);
    expect(stored.status).toBe(200);
    expect(stored.headers.get("content-type")).toBe("image/jpeg");
    expect(new Uint8Array(await stored.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
  });

  it("requires a Better Auth session when auth is configured", async () => {
    const app = createApp({
      store: new MemoryPicImpactStore(),
      auth: {
        handler: () => new Response(null, { status: 204 }),
        api: {
          getSession: async () => null,
        },
      },
    });

    const response = await app.request("http://localhost/api/config");
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({
      code: 401,
      message: "Authentication required",
    });
  });

  it("keeps the Better Auth core schema separate from v3 plugin tables", () => {
    expect(Object.keys(schema)).toEqual(
      expect.arrayContaining(["user", "session", "account", "verification"]),
    );
    expect(Object.keys(schema)).not.toEqual(expect.arrayContaining(["twoFactor", "passkey"]));
    expect(Object.keys(schema.user)).toEqual(
      expect.arrayContaining([
        "id",
        "name",
        "email",
        "emailVerified",
        "image",
        "createdAt",
        "updatedAt",
      ]),
    );
  });

  it("resolves storage settings from the config store at request time", async () => {
    const store = new MemoryPicImpactStore();
    const resolveStorage = createStorageResolver(store);
    expect((await resolveStorage()).maxUploadBytes).toBe(25 * 1024 * 1024);

    await store.upsertConfig({
      config_key: "storage.driver",
      config_value: "memory",
    });
    await store.upsertConfig({
      config_key: "storage.max_upload_bytes",
      config_value: "3",
    });

    const resolved = await resolveStorage();
    expect(resolved.maxUploadBytes).toBe(3);
    expect(resolved.storage).toBeInstanceOf(MemoryObjectStorage);
  });

  it("signs S3 requests with the Worker-compatible Web Crypto adapter", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const storage = new S3FetchObjectStorage({
      endpoint: "https://s3.example.test",
      region: "auto",
      bucket: "picimpact",
      accessKeyId: "access",
      secretAccessKey: "secret",
    });

    await storage.put({
      key: "photos/sample.jpg",
      body: new Uint8Array([1, 2, 3]),
      contentType: "image/jpeg",
      contentLength: 3,
    });

    const [, init] = fetchMock.mock.calls[0] as [RequestInfo | URL, RequestInit];
    expect(init.method).toBe("PUT");
    expect(new Headers(init.headers).get("authorization")).toMatch(
      /^AWS4-HMAC-SHA256 Credential=access\/\d{8}\/auto\/s3\/aws4_request/,
    );
    expect(new Headers(init.headers).get("x-amz-content-sha256")).toBeTruthy();
    vi.unstubAllGlobals();
  });
});
