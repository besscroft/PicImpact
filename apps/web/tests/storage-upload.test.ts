import { afterEach, expect, it, vi } from "vite-plus/test";

import { createApp } from "../src/server/app";
import { S3FetchObjectStorage } from "../src/server/storage-s3-fetch";
import { S3ObjectStorage } from "../src/server/storage-s3";
import { MemoryPicImpactStore } from "./helpers";

vi.mock("@aws-sdk/client-s3", () => {
  class S3ServiceException extends Error {
    $metadata = { httpStatusCode: 403 };
  }

  return {
    S3ServiceException,
    S3Client: class {
      async send() {
        throw new S3ServiceException("private upstream detail");
      }
    },
    PutObjectCommand: class {},
  };
});

const options = {
  region: "auto",
  bucket: "photos",
  accessKeyId: "test-access-key",
  secretAccessKey: "test-secret-key",
};

afterEach(() => {
  vi.unstubAllGlobals();
});

it.each(["Node original", "Worker preview"])(
  "reports a storage authorization failure during %s upload without saving a photo",
  async (scenario) => {
    const isNode = scenario === "Node original";
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce(new Response(null, { status: 200 }))
        .mockResolvedValueOnce(new Response("private upstream detail", { status: 403 })),
    );
    const config = { ...options, endpoint: "https://s3.example.test" };
    const storage = isNode ? new S3ObjectStorage(config) : new S3FetchObjectStorage(config);
    const app = createApp({ store: new MemoryPicImpactStore(), storage });
    const body = new FormData();
    body.set("file", new File(["original"], "original.jpg", { type: "image/jpeg" }));
    body.set("preview", new File(["preview"], "preview.webp", { type: "image/webp" }));

    const response = await app.request("/api/photos/upload", { method: "POST", body });

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      code: 502,
      message: "对象存储拒绝写入，请检查 S3/R2 凭证、存储桶及写入权限。",
    });
    const photos = await app.request("/api/photos");
    expect(await photos.json()).toMatchObject({ data: [] });
  },
);
