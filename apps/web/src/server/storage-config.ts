import type { R2Bucket } from "@cloudflare/workers-types";

import type { PicImpactStore } from "./store";
import { R2ObjectStorage, type ObjectStorage } from "./storage";
import type { S3StorageOptions } from "./storage-s3-types";

export type StorageRuntime = {
  r2?: R2Bucket;
  createS3?: (options: S3StorageOptions) => ObjectStorage;
};

export type ResolvedStorage = {
  storage: ObjectStorage | null;
  maxUploadBytes: number;
  /** 对象 key 的目录前缀（无首尾斜杠），'' 表示桶根路径。参考 v3 storage_folder。 */
  storageFolder: string;
};

const DEFAULT_MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export function createStorageResolver(store: PicImpactStore, runtime: StorageRuntime = {}) {
  let cachedFingerprint: string | undefined;
  let cachedResolution: ResolvedStorage | undefined;

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

    const driver = values.get("storage.driver") || "";
    const maxUploadBytes = parseMaxUploadBytes(values.get("storage.max_upload_bytes"));
    const storageFolder = normalizeFolder(
      driver === "r2"
        ? values.get("storage.r2.storage_folder")
        : values.get("storage.storage_folder"),
    );
    let storage: ObjectStorage | null = null;

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
        publicUrl: values.get("storage.public_url") || undefined,
      });
    } else if (driver === "r2") {
      // 参考 v3：R2 通过 API 凭证走 S3 兼容端点；未配置凭证时回退 Workers R2 binding。
      const accountId = values.get("storage.r2.account_id") || "";
      const accessKeyId = values.get("storage.r2.access_key_id") || "";
      const secretAccessKey = values.get("storage.r2.secret_access_key") || "";
      const bucket = values.get("storage.r2.bucket") || "";
      const publicUrl = values.get("storage.r2.public_url") || undefined;
      if (runtime.createS3 && accountId && accessKeyId && secretAccessKey && bucket) {
        storage = runtime.createS3({
          endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
          region: "auto",
          bucket,
          accessKeyId,
          secretAccessKey,
          publicUrl,
        });
      } else if (runtime.r2) {
        storage = new R2ObjectStorage(runtime.r2, publicUrl);
      }
    }

    cachedFingerprint = fingerprint;
    cachedResolution = { storage, maxUploadBytes, storageFolder };
    return cachedResolution;
  };
}

function normalizeFolder(value: string | undefined) {
  return (value || "").replace(/^\/+|\/+$/g, "");
}

function parseMaxUploadBytes(value: string | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_UPLOAD_BYTES;
}
