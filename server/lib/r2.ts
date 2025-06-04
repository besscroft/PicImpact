import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { Config } from '~/types'

let s3R2Client: S3Client | null = null

export function getR2Client(findConfig: Config[]) {
  if (!findConfig.length) {
    console.warn('警告：无法获取 R2 配置信息，请配置相应信息。')
  }
  if (s3R2Client) return s3R2Client

  const r2AccesskeyId = findConfig.find((item: Config) => item.config_key === 'r2_accesskey_id')?.config_value || ''
  const r2AccesskeySecret = findConfig.find((item: Config) => item.config_key === 'r2_accesskey_secret')?.config_value || ''
  const r2Endpoint = findConfig.find((item: Config) => item.config_key === 'r2_endpoint')?.config_value || ''

  s3R2Client = new S3Client({
    region: 'auto',
    endpoint: r2Endpoint.includes('https://') ? r2Endpoint : `https://${r2Endpoint}`,
    credentials: {
      accessKeyId: r2AccesskeyId,
      secretAccessKey: r2AccesskeySecret,
    },
  })

  return s3R2Client
}

export async function generatePresignedUrl(
  r2Client: S3Client,
  bucket: string,
  key: string,
  operation: 'get' | 'put' = 'get',
  expiresIn: number = 3600,
) {
  const command = operation === 'get'
    ? new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    : new PutObjectCommand({
        Bucket: bucket,
        Key: key,
      })

  return await getSignedUrl(r2Client, command, { expiresIn })
}