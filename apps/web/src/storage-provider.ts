export const STORAGE_PROVIDERS = [
  { value: "s3", label: "S3 API" },
  { value: "r2", label: "Cloudflare R2" },
] as const;

export type StorageProvider = (typeof STORAGE_PROVIDERS)[number]["value"];

export function isStorageProvider(value: unknown): value is StorageProvider {
  return value === "s3" || value === "r2";
}
