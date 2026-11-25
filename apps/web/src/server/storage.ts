import type { R2Bucket } from "@cloudflare/workers-types";

export type StoragePutInput = {
  key: string;
  body: ArrayBuffer | Uint8Array;
  contentType: string;
  contentLength: number;
};

export type StoredObject = {
  body: Uint8Array;
  contentType: string;
};

export interface ObjectStorage {
  put(input: StoragePutInput): Promise<void>;
  get(key: string): Promise<StoredObject | null>;
  url(key: string, requestOrigin: string): string;
}

export class MemoryObjectStorage implements ObjectStorage {
  private readonly objects = new Map<string, StoredObject>();

  async put(input: StoragePutInput) {
    const body = input.body instanceof Uint8Array ? input.body : new Uint8Array(input.body);
    this.objects.set(input.key, {
      body: new Uint8Array(body),
      contentType: input.contentType,
    });
  }

  async get(key: string) {
    const object = this.objects.get(key);
    return object
      ? {
          body: new Uint8Array(object.body),
          contentType: object.contentType,
        }
      : null;
  }

  url(key: string, requestOrigin: string) {
    return `${requestOrigin}/api/storage/${encodePath(key)}`;
  }
}

export class R2ObjectStorage implements ObjectStorage {
  constructor(
    private readonly bucket: R2Bucket,
    private readonly publicUrl?: string,
  ) {}

  async put(input: StoragePutInput) {
    await this.bucket.put(input.key, input.body, {
      httpMetadata: {
        contentType: input.contentType,
      },
      customMetadata: {
        contentLength: String(input.contentLength),
      },
    });
  }

  async get(key: string) {
    const object = await this.bucket.get(key);
    if (!object) return null;
    return {
      body: new Uint8Array(await object.arrayBuffer()),
      contentType: object.httpMetadata?.contentType ?? "application/octet-stream",
    };
  }

  url(key: string, requestOrigin: string) {
    return this.publicUrl
      ? `${trimTrailingSlash(this.publicUrl)}/${encodePath(key)}`
      : `${requestOrigin}/api/storage/${encodePath(key)}`;
  }
}

export function encodePath(value: string) {
  return value
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}
