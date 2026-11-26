import { describe, expect, it, vi } from "vite-plus/test";

import { createApp } from "../src/server/app";
import { MemoryObjectStorage, MemoryPicImpactStore } from "./helpers";
import { schema } from "../src/server/db/schema";
import { createStorageResolver } from "../src/server/storage-config";
import { S3FetchObjectStorage } from "../src/server/storage-s3-fetch";

describe("PicImpact web API", () => {
  it("serves the public homepage feed and albums without admin auth", async () => {
    const store = new MemoryPicImpactStore();
    await store.upsertAlbum({
      album_value: "travel",
      name: "Travel",
      show: 0,
      sort: 1,
    });
    await store.upsertImage({
      id: "public-photo",
      image_name: "lake.jpg",
      url: "https://cdn.example.test/lake.jpg",
      preview_url: "https://cdn.example.test/lake-thumb.jpg",
      width: 1600,
      height: 1000,
      show: 0,
      show_on_mainpage: 0,
      sort: 2,
    });
    await store.upsertImage({
      id: "private-photo",
      image_name: "private.jpg",
      url: "https://cdn.example.test/private.jpg",
      width: 1200,
      height: 800,
      show: 1,
      show_on_mainpage: 0,
      sort: 1,
    });
    const app = createApp({ store });

    const albums = await app.request("http://localhost/api/public/albums");
    expect(albums.status).toBe(200);
    expect(await albums.json()).toMatchObject({
      data: [expect.objectContaining({ album_value: "travel", show: 0 })],
    });

    const images = await app.request("http://localhost/api/public/images?album=/");
    expect(images.status).toBe(200);
    expect(await images.json()).toMatchObject({
      data: [expect.objectContaining({ id: "public-photo" })],
      page: 1,
      total: 1,
    });
  });

  it("returns a public image detail with neighboring photos", async () => {
    const store = new MemoryPicImpactStore();
    await store.upsertImage({
      id: "photo-1",
      url: "https://cdn.example.test/1.jpg",
      width: 100,
      height: 100,
      show: 0,
      show_on_mainpage: 0,
      sort: 3,
    });
    await store.upsertImage({
      id: "photo-2",
      url: "https://cdn.example.test/2.jpg",
      width: 100,
      height: 100,
      show: 0,
      show_on_mainpage: 0,
      sort: 2,
    });
    const app = createApp({ store });

    const detail = await app.request("http://localhost/api/public/images/photo-1");
    expect(detail.status).toBe(200);
    expect(await detail.json()).toMatchObject({
      data: expect.objectContaining({ id: "photo-1" }),
      neighbors: {
        previous: null,
        next: expect.objectContaining({ id: "photo-2" }),
      },
    });
  });

  it("filters the admin image list, binds albums and batch deletes", async () => {
    const store = new MemoryPicImpactStore();
    await store.upsertAlbum({ album_value: "travel", name: "Travel", show: 0, sort: 1 });
    await store.upsertImage({
      id: "photo-1",
      url: "https://cdn.example.test/1.jpg",
      width: 100,
      height: 100,
      show: 0,
      sort: 2,
      exif: { model: "Sony A7", lens_model: "FE 24-70" },
    });
    await store.upsertImage({
      id: "photo-2",
      url: "https://cdn.example.test/2.jpg",
      width: 100,
      height: 100,
      show: 1,
      sort: 1,
      exif: { model: "Fujifilm X-T5" },
    });
    await store.setImageAlbum("photo-1", "travel");
    const app = createApp({ store });

    const list = await app.request("http://localhost/api/photos");
    expect(list.status).toBe(200);
    expect(await list.json()).toMatchObject({
      data: expect.arrayContaining([
        expect.objectContaining({ id: "photo-1", album_name: "Travel" }),
      ]),
      total: 2,
      pages: 1,
    });

    const filtered = await app.request("http://localhost/api/photos?show=1");
    expect(await filtered.json()).toMatchObject({
      data: [expect.objectContaining({ id: "photo-2" })],
      total: 1,
    });

    const byCamera = await app.request(
      "http://localhost/api/photos?camera=" + encodeURIComponent("Sony A7"),
    );
    expect(await byCamera.json()).toMatchObject({
      data: [expect.objectContaining({ id: "photo-1" })],
      total: 1,
    });

    const cameraLens = await app.request("http://localhost/api/photos/camera-lens-list");
    expect(await cameraLens.json()).toEqual({
      data: { cameras: ["Fujifilm X-T5", "Sony A7"], lenses: ["FE 24-70"] },
    });

    const rebind = await app.request("http://localhost/api/photos/photo-2/album", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ album_value: "travel" }),
    });
    expect(rebind.status).toBe(200);
    const afterRebind = await app.request("http://localhost/api/photos?album=travel");
    expect(await afterRebind.json()).toMatchObject({ total: 2 });

    const batchDelete = await app.request("http://localhost/api/photos/batch-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: ["photo-1"] }),
    });
    expect(batchDelete.status).toBe(200);
    expect(await batchDelete.json()).toMatchObject({ data: { deleted: 1 } });

    const afterDelete = await app.request("http://localhost/api/photos");
    expect(await afterDelete.json()).toMatchObject({
      data: [expect.objectContaining({ id: "photo-2" })],
      total: 1,
    });
  });

  it("manages albums: create, toggle show, update with route rename, delete", async () => {
    const store = new MemoryPicImpactStore();
    await store.upsertImage({
      id: "photo-1",
      url: "https://cdn.example.test/1.jpg",
      width: 10,
      height: 10,
    });
    await store.setImageAlbum("photo-1", "/travel");
    const app = createApp({ store });

    const invalid = await app.request("http://localhost/api/albums", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ album_value: "travel", name: "Travel" }),
    });
    expect(invalid.status).toBe(400);

    const created = await app.request("http://localhost/api/albums", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ album_value: "/travel", name: "Travel", sort: 2 }),
    });
    expect(created.status).toBe(201);

    const list = await app.request("http://localhost/api/albums");
    expect(await list.json()).toMatchObject({
      data: [expect.objectContaining({ id: "/travel", name: "Travel", show: 1, sort: 2 })],
    });

    const toggle = await app.request("http://localhost/api/albums/%2Ftravel/show", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ show: 0 }),
    });
    expect(toggle.status).toBe(200);

    const renamed = await app.request("http://localhost/api/albums/%2Ftravel", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        album_value: "/trip",
        name: "Trip",
        sort: 1,
        show: 0,
        theme: "1",
        random_show: 0,
        image_sorting: 2,
      }),
    });
    expect(renamed.status).toBe(200);

    const afterRename = await app.request("http://localhost/api/photos?album=/trip");
    expect(await afterRename.json()).toMatchObject({ total: 1 });

    const albumDetail = await app.request("http://localhost/api/albums");
    expect(await albumDetail.json()).toMatchObject({
      data: [expect.objectContaining({ id: "/trip", name: "Trip", show: 0, theme: "1" })],
    });

    const removed = await app.request("http://localhost/api/albums/%2Ftrip", {
      method: "DELETE",
    });
    expect(removed.status).toBe(200);

    const finalList = await app.request("http://localhost/api/albums");
    expect(await finalList.json()).toMatchObject({ data: [] });
  });

  it("updates visibility and exposes dashboard aggregates for admins", async () => {
    const store = new MemoryPicImpactStore();
    await store.upsertAlbum({
      album_value: "travel",
      name: "Travel",
      show: 0,
      sort: 1,
    });
    await store.upsertImage({
      id: "photo-1",
      title: "Lake",
      url: "https://cdn.example.test/1.jpg",
      width: 100,
      height: 100,
      show: 1,
      show_on_mainpage: 1,
      sort: 3,
    });
    const app = createApp({ store });

    const update = await app.request("http://localhost/api/photos/photo-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ show: 0, show_on_mainpage: 0, title: "Lake at dusk" }),
    });
    expect(update.status).toBe(200);
    expect(await update.json()).toMatchObject({
      data: { id: "photo-1", show: 0, show_on_mainpage: 0, title: "Lake at dusk" },
    });

    const dashboard = await app.request("http://localhost/api/admin/dashboard");
    expect(dashboard.status).toBe(200);
    expect(await dashboard.json()).toMatchObject({
      data: {
        summary: { totalImages: 1, publicImages: 1 },
        coverage: { featuredOnHome: 1 },
      },
    });
  });

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

  it("writes storage configuration and returns it through the same store", async () => {
    const app = createApp({ store: new MemoryPicImpactStore() });

    const save = await app.request("http://localhost/api/storage-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        "storage.driver": "s3",
        "storage.endpoint": "https://s3.example.com",
        "storage.region": "auto",
        "storage.bucket": "picimpact",
        "storage.access_key_id": "key",
        "storage.secret_access_key": "secret",
        "storage.public_url": "",
        "storage.max_upload_bytes": "",
      }),
    });
    expect(save.status).toBe(200);

    const list = await app.request("http://localhost/api/config");
    expect(await list.json()).toEqual({
      data: expect.arrayContaining([
        expect.objectContaining({
          config_key: "storage.driver",
          config_value: "s3",
        }),
      ]),
    });

    const genericWrite = await app.request("http://localhost/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        config_key: "site_title",
        config_value: "PicImpact",
      }),
    });
    expect(genericWrite.status).toBe(404);
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
    // 未配置驱动时不提供任何对象存储
    expect((await resolveStorage()).storage).toBeNull();

    await store.upsertConfig({
      config_key: "storage.max_upload_bytes",
      config_value: "3",
    });
    const limited = await resolveStorage();
    expect(limited.maxUploadBytes).toBe(3);
    expect(limited.storage).toBeNull();

    const s3Resolver = createStorageResolver(store, {
      createS3: (options) => new S3FetchObjectStorage(options),
    });
    await store.upsertConfig({ config_key: "storage.driver", config_value: "s3" });
    await store.upsertConfig({ config_key: "storage.bucket", config_value: "picimpact" });
    await store.upsertConfig({ config_key: "storage.access_key_id", config_value: "access" });
    await store.upsertConfig({ config_key: "storage.secret_access_key", config_value: "secret" });
    const resolved = await s3Resolver();
    expect(resolved.maxUploadBytes).toBe(3);
    expect(resolved.storage).toBeInstanceOf(S3FetchObjectStorage);
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
