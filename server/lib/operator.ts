import 'server-only'

import { Operator } from 'opendal'

/**
 * 上传单个对象到存储桶
 * @param operator s3 客户端
 * @param params 上传参数
 */
export async function uploadSimpleObject(operator: Operator, params: {
  key: string,
  body: Buffer,
  contentType: string
}) {
  operator.writeSync(params.key, params.body, {
    contentType: params.contentType,
  })
}

/**
 * 获取直链上传链接
 * @param operator s3 客户端
 * @param params 上传参数
 */
export async function generatePresignedUrl(operator: Operator, params: {
  key: string,
  expiresIn: number,
}) {
  return operator.presignWrite(params.key, params.expiresIn)
}

/**
 * 获取直链下载链接
 * @param operator s3 客户端
 * @param params 下载参数
 */
export async function generatePresignedDownloadUrl(operator: Operator, params: {
  key: string,
  expiresIn: number,
}) {
  return operator.presignRead(params.key, params.expiresIn)
}