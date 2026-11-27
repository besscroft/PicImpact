import { describe, expect, it } from "vite-plus/test";

import { createApp } from "../src/server/app";
import type { PublicImageRecord } from "../src/server/store";
import type { PicImpactStore } from "../src/server/store";
import { S3FetchObjectStorage } from "../src/server/storage-s3-fetch";
import type { ObjectStorage } from "../src/server/storage";

function imageRecord(overrides: Partial<PublicImageRecord> = {}): PublicImageRecord {
  return {
    id: "img-1",
    image_name: "原图 名字.jpg",
    url: "https://storage.example/api/storage/photos/2026-01-01/img-1-%E5%8E%9F%E5%9B%BE.jpg?storage=r2",
    preview_url: null,
    video_url: null,
    blurhash: null,
    exif: null,
    labels: null,
    width: 100,
    height: 100,
    lon: null,
    lat: null,
    title: null,
    detail: null,
    type: 1,
    show: 0,
    show_on_mainpage: 1,
    sort: 0,
    del: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: null,
    image_key: "picimpact/photos/2026-01-01/img-1-原图.jpg",
    ...overrides,
  };
}

function configRecord(key: string, value: string | null) {
  return { config_key: key, config_value: value, detail: null, createdAt: "", updatedAt: null };
}

type ConfigRow = { config_key: string; config_value: string | null };

function stubStore(options: { images?: PublicImageRecord[]; configs?: ConfigRow[] }) {
  return {
    getPublicImage: async (id: string) => options.images?.find((image) => image.id === id) ?? null,
    listConfigs: async () => (options.configs ?? []).map((row) => configRecord(row.config_key, row.config_value)),
  } as unknown as PicImpactStore;
}

function stubStorage(presign = true) {
  const storage: ObjectStorage = {
    put: async () => {},
    get: async (key: string) =>
      key.includes("missing") ? null : { body: new Uint8Array([1, 2, 3]), contentType: "image/jpeg" },
    url: (_key: string, origin: string) => `${origin}/api/storage/x`,
    ...(presign ? { presignedGetUrl: async (key: string) => `https://signed.example/${key}` } : {}),
  };
  return storage;
}

function app(options: { images?: PublicImageRecord[]; configs?: ConfigRow[]; presign?: boolean }) {
  return createApp({
    store: stubStore({ images: options.images, configs: options.configs }),
    storage: stubStorage(options.presign ?? true),
  });
}

type DownloadFlagsPayload = {
  data: { s3DirectDownload: boolean; r2DirectDownload: boolean; driver: string };
};
type PresignedPayload = { data: { url: string; filename: string } };

async function jsonOf<T>(response: Response) {
  return (await response.json()) as T;
}

describe("direct download endpoints", () => {
  it("reports direct-download flags from config with presign capability", async () => {
    const application = app({
      configs: [
        configRecord("storage.direct_download", "true"),
        configRecord("storage.r2.direct_download", "true"),
        configRecord("storage.driver", "r2"),
      ],
    });
    const response = await application.fetch(new Request("https://app.example/api/public/download/config"));
    expect(response.status).toBe(200);
    const payload = await jsonOf<DownloadFlagsPayload>(response);
    expect(payload.data).toEqual({
      s3DirectDownload: true,
      r2DirectDownload: true,
      driver: "r2",
    });
  });

  it("clears flags when the resolved storage cannot presign", async () => {
    const application = app({
      presign: false,
      configs: [configRecord("storage.r2.direct_download", "true")],
    });
    const response = await application.fetch(new Request("https://app.example/api/public/download/config"));
    const payload = await jsonOf<DownloadFlagsPayload>(response);
    expect(payload.data.r2DirectDownload).toBe(false);
    expect(payload.data.s3DirectDownload).toBe(false);
  });

  it("rejects an unsupported storage parameter", async () => {
    const application = app({ images: [imageRecord()] });
    const response = await application.fetch(
      new Request("https://app.example/api/public/download/img-1?storage=oss"),
    );
    expect(response.status).toBe(400);
  });

  it("returns 404 for an unknown image", async () => {
    const application = app({ images: [] });
    const response = await application.fetch(
      new Request("https://app.example/api/public/download/missing?storage=r2"),
    );
    expect(response.status).toBe(404);
  });

  it("proxies the original bytes with an attachment disposition", async () => {
    const application = app({ images: [imageRecord()] });
    const response = await application.fetch(
      new Request("https://app.example/api/public/download/img-1?storage=r2"),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/jpeg");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    const disposition = response.headers.get("content-disposition") ?? "";
    expect(disposition.startsWith("attachment;")).toBe(true);
    expect(disposition).toContain("filename*=UTF-8''");
    expect(disposition).toContain(encodeURIComponent("原图 名字.jpg"));
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
  });

  it("returns a presigned URL with the derived filename", async () => {
    const application = app({ images: [imageRecord()] });
    const response = await application.fetch(
      new Request("https://app.example/api/public/download/img-1/presigned?storage=r2"),
    );
    expect(response.status).toBe(200);
    const payload = await jsonOf<PresignedPayload>(response);
    expect(payload.data.url).toBe("https://signed.example/picimpact/photos/2026-01-01/img-1-原图.jpg");
    expect(payload.data.filename).toBe("原图 名字.jpg");
  });

  it("rejects presign when storage cannot presign", async () => {
    const application = app({ images: [imageRecord()], presign: false });
    const response = await application.fetch(
      new Request("https://app.example/api/public/download/img-1/presigned?storage=r2"),
    );
    expect(response.status).toBe(400);
  });

  it("falls back to the url-derived key when image_key is absent", async () => {
    const record = imageRecord({ image_key: null });
    const application = app({ images: [record] });
    const response = await application.fetch(
      new Request("https://app.example/api/public/download/img-1/presigned?storage=r2"),
    );
    expect(response.status).toBe(200);
    const payload = await jsonOf<PresignedPayload>(response);
    expect(payload.data.url).toBe(
      "https://signed.example/photos/2026-01-01/img-1-原图.jpg",
    );
  });
});

describe("S3FetchObjectStorage presigned URL", () => {
  it("builds a SigV4 query-signed GET url", async () => {
    const storage = new S3FetchObjectStorage({
      endpoint: "https://account-id.r2.cloudflarestorage.com",
      region: "auto",
      bucket: "picimpact",
      accessKeyId: "ak",
      secretAccessKey: "sk",
      forcePathStyle: true,
    });
    const url = new URL(await storage.presignedGetUrl("photos/2026/a b.jpg", 900));
    expect(url.origin).toBe("https://account-id.r2.cloudflarestorage.com");
    expect(url.pathname).toBe("/picimpact/photos/2026/a%20b.jpg");
    expect(url.searchParams.get("X-Amz-Algorithm")).toBe("AWS4-HMAC-SHA256");
    expect(url.searchParams.get("X-Amz-Expires")).toBe("900");
    expect(url.searchParams.get("X-Amz-SignedHeaders")).toBe("host");
    expect(url.searchParams.get("X-Amz-Credential")).toMatch(/^ak\/\d{8}\/auto\/s3\/aws4_request$/);
    expect(url.searchParams.get("X-Amz-Signature")).toMatch(/^[0-9a-f]{64}$/);
  });
});
