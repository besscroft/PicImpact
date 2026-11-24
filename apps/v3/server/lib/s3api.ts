import 'server-only'

import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export async function generatePresignedUrl(
  s3Client: S3Client,
  bucket: string,
  key: string,
  contentType: string,
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
      ContentType: contentType || undefined
    })

  return await getSignedUrl(s3Client as any, command as any, { expiresIn })
}