import type { R2Bucket } from "@cloudflare/workers-types";

import type { PicImpactStore } from "./store";
import { MemoryObjectStorage, R2ObjectStorage, type ObjectStorage } from "./storage";
import type { S3StorageOptions } from "./storage-s3-types";

export type StorageRuntime = {
  r2?: R2Bucket;
  createS3?: (options: S3StorageOptions) => ObjectStorage;
};

export type ResolvedStorage = {
  storage: ObjectStorage;
  maxUploadBytes: number;
};

const DEFAULT_MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export function createStorageResolver(store: PicImpactStore, runtime: StorageRuntime = {}) {
  let cachedFingerprint: string | undefined;
  let cachedResolution: ResolvedStorage | undefined;
  const memoryStorage = new MemoryObjectStorage();

  return async (): Promise<ResolvedStorage> => {
    const configs = await store.listConfigs();
    const values = new Map(
      configs
        .filter((config) => config.config_key.startsWith("storage."))
        .map((config) => [config.config_key, config.config_value ?? ""]),
    );
    const fingerprint = JSON.stringify(
      [...values.entries()].sort(([left], [right]) => left.localeCompare(right)),
    );
    if (cachedResolution && fingerprint === cachedFingerprint) {
      return cachedResolution;
    }

    const driver = values.get("storage.driver") || "memory";
    const publicUrl = values.get("storage.public_url") || undefined;
    const maxUploadBytes = parseMaxUploadBytes(values.get("storage.max_upload_bytes"));
    let storage: ObjectStorage = memoryStorage;

    if (
      driver === "s3" &&
      runtime.createS3 &&
      values.get("storage.bucket") &&
      values.get("storage.access_key_id") &&
      values.get("storage.secret_access_key")
    ) {
      storage = runtime.createS3({
        endpoint: values.get("storage.endpoint") || undefined,
        region: values.get("storage.region") || "auto",
        bucket: values.get("storage.bucket")!,
        accessKeyId: values.get("storage.access_key_id")!,
        secretAccessKey: values.get("storage.secret_access_key")!,
        publicUrl,
      });
    } else if (driver === "r2" && runtime.r2) {
      storage = new R2ObjectStorage(runtime.r2, publicUrl);
    }

    cachedFingerprint = fingerprint;
    cachedResolution = { storage, maxUploadBytes };
    return cachedResolution;
  };
}

function parseMaxUploadBytes(value: string | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_UPLOAD_BYTES;
}
