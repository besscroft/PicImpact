import 'server-only'

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

/**
 * 上传单个对象到存储桶
 * @param client s3 客户端
 * @param params 上传参数
 */
export async function uploadSimpleObject(client: S3Client, params: {
  Bucket: string,
  Key: string,
  Body: Buffer,
  ContentLength: number
  ContentType: string
}) {
  await client.send(
    new PutObjectCommand(params)
  )
}