import 'server-only'

import type { S3Client } from '@aws-sdk/client-s3'

import { fetchConfigsByKeys } from '~/server/db/query/configs'
import { getClient } from '~/server/lib/s3'
import { getR2Client } from '~/server/lib/r2'
import type { Config } from '~/types'

/**
 * Which storage backend the image-preprocessing pipeline uploads variants to.
 *
 * PicImpact has no global "active backend" — each upload picks one client-side
 * and only the final URL is stored, with no per-image record of the backend.
 * The variant pipeline therefore needs one explicit target: the admin sets the
 * `variant_storage` config to `s3` or `r2`; an empty value disables the variant
 * pipeline entirely (the gallery loader then sleeps and falls back to the
 * existing preview/blurhash behaviour). Open List is intentionally unsupported
 * for variants — it returns a per-file URL via API with no predictable
 * `{key}_{w}.{fmt}` pattern the client loader can reconstruct.
 */
export type VariantStorageBackend = 's3' | 'r2'

function readConfig(configs: Config[], key: string) {
  return configs.find((item) => item.config_key === key)?.config_value ?? ''
}

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, '')
}

function stripScheme(value: string) {
  return value.replace(/^https?:\/\//, '')
}

function joinFolder(root: string, storageFolder: string) {
  const folder = storageFolder.replace(/^\/+|\/+$/g, '')
  return folder ? `${stripTrailingSlash(root)}/${folder}` : stripTrailingSlash(root)
}

function parseBackend(value: string): VariantStorageBackend | null {
  return value === 's3' || value === 'r2' ? value : null
}

const VARIANT_STORAGE_CONFIG_KEYS = [
  'variant_storage',
  // s3
  'accesskey_id',
  'accesskey_secret',
  'region',
  'endpoint',
  'bucket',
  'storage_folder',
  'force_path_style',
  's3_cdn',
  's3_cdn_url',
  // r2
  'r2_accesskey_id',
  'r2_accesskey_secret',
  'r2_account_id',
  'r2_bucket',
  'r2_storage_folder',
  'r2_public_domain',
]

export type ResolvedVariantStorage = {
  backend: VariantStorageBackend
  client: S3Client
  bucket: string
  /** Storage folder prefix (no leading/trailing slash), '' for bucket root. */
  storageFolder: string
  /** Public base URL (no trailing slash, already includes the storage folder). */
  baseUrl: string
}

/** Public root for S3 variants (no trailing slash, folder appended). */
function buildS3BaseUrl(configs: Config[]) {
  const bucket = readConfig(configs, 'bucket')
  const storageFolder = readConfig(configs, 'storage_folder')
  const endpoint = stripScheme(readConfig(configs, 'endpoint'))
  const s3Cdn = readConfig(configs, 's3_cdn') === 'true'
  const s3CdnUrl = stripScheme(readConfig(configs, 's3_cdn_url'))
  const forcePathStyle = readConfig(configs, 'force_path_style') === 'true'

  let root: string
  if (s3Cdn && s3CdnUrl) {
    root = `https://${s3CdnUrl}`
  } else if (!endpoint || !bucket) {
    return ''
  } else if (forcePathStyle) {
    root = `https://${endpoint}/${bucket}`
  } else {
    root = `https://${bucket}.${endpoint}`
  }

  return joinFolder(root, storageFolder)
}

/** Public root for R2 variants (no trailing slash, folder appended). */
function buildR2BaseUrl(configs: Config[]) {
  const publicDomain = readConfig(configs, 'r2_public_domain')
  if (!publicDomain) return ''
  return joinFolder(publicDomain, readConfig(configs, 'r2_storage_folder'))
}

/**
 * Resolve the public base URL for variant objects, or '' when the variant
 * pipeline is not configured. Exposed to the gallery via `variantBaseUrl`; the
 * client loader builds `{baseUrl}/{image_key}_{w}.{fmt}`.
 */
export async function getVariantBaseUrl(): Promise<string> {
  const configs = await fetchConfigsByKeys(VARIANT_STORAGE_CONFIG_KEYS)
  const backend = parseBackend(readConfig(configs, 'variant_storage'))
  if (backend === 's3') return buildS3BaseUrl(configs)
  if (backend === 'r2') return buildR2BaseUrl(configs)
  return ''
}

/**
 * Resolve the active variant storage backend (client + bucket + folder + public
 * base), or `null` when not configured. Used by the preprocessing pipeline to
 * upload generated variants.
 */
export async function resolveVariantStorage(): Promise<ResolvedVariantStorage | null> {
  const configs = await fetchConfigsByKeys(VARIANT_STORAGE_CONFIG_KEYS)
  const backend = parseBackend(readConfig(configs, 'variant_storage'))
  if (!backend) return null

  if (backend === 's3') {
    const bucket = readConfig(configs, 'bucket')
    const baseUrl = buildS3BaseUrl(configs)
    if (!bucket || !baseUrl) return null
    return {
      backend,
      client: getClient(configs),
      bucket,
      storageFolder: readConfig(configs, 'storage_folder').replace(/^\/+|\/+$/g, ''),
      baseUrl,
    }
  }

  const bucket = readConfig(configs, 'r2_bucket')
  const baseUrl = buildR2BaseUrl(configs)
  if (!bucket || !baseUrl) return null
  return {
    backend,
    client: getR2Client(configs),
    bucket,
    storageFolder: readConfig(configs, 'r2_storage_folder').replace(/^\/+|\/+$/g, ''),
    baseUrl,
  }
}
