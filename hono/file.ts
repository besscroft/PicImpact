import 'server-only'

import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { cors } from 'hono/cors'
import { alistUpload, r2Upload, s3Upload } from '~/server/lib/file-upload'
import { fetchConfigsByKeys } from '~/server/db/query/configs'
import { getClient, generatePresignedUrl as generateS3PresignedUrl } from '~/server/lib/s3'
import { getR2Client, generatePresignedUrl as generateR2PresignedUrl } from '~/server/lib/r2'

const app = new Hono()

// 添加 CORS 中间件
app.use('/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
  maxAge: 600,
  credentials: true,
}))

app.post('/upload', async (c) => {
  const formData = await c.req.formData()

  const file = formData.get('file')
  const storage = formData.get('storage')
  const type = formData.get('type')
  const mountPath = formData.get('mountPath') || ''

  if (storage) {
    switch (storage.toString()) {
      case 's3': {
        const configs = await fetchConfigsByKeys([
          'accesskey_id',
          'accesskey_secret',
          'region',
          'endpoint',
          'bucket',
          'storage_folder',
          'force_path_style',
          's3_cdn',
          's3_cdn_url',
          's3_direct_upload'
        ])
        const directUpload = configs.find((item: any) => item.config_key === 's3_direct_upload')?.config_value === 'true'
        const bucket = configs.find((item: any) => item.config_key === 'bucket')?.config_value || ''
        const storageFolder = configs.find((item: any) => item.config_key === 'storage_folder')?.config_value || ''

        if (directUpload) {
          const filePath = storageFolder && storageFolder !== '/'
            ? type && type !== '/' ? `${storageFolder}${type}/${file?.name}` : `${storageFolder}/${file?.name}`
            : type && type !== '/' ? `${type.slice(1)}/${file?.name}` : `${file?.name}`
          const client = getClient(configs)
          const presignedUrl = await generateS3PresignedUrl(client, bucket, filePath)
          return Response.json({
            code: 200,
            data: {
              upload_url: presignedUrl,
              key: filePath
            }
          })
        }
        return await s3Upload(file, type)
          .then((result: string) => {
            return Response.json({
              code: 200, data: result
            })
          })
          .catch(e => {
            throw new HTTPException(500, { message: 'Failed', cause: e })
          })
      }
      case 'r2': {
        const configs = await fetchConfigsByKeys([
          'r2_accesskey_id',
          'r2_accesskey_secret',
          'r2_endpoint',
          'r2_bucket',
          'r2_storage_folder',
          'r2_public_domain',
          'r2_direct_upload'
        ])
        const directUpload = configs.find((item: any) => item.config_key === 'r2_direct_upload')?.config_value === 'true'
        const bucket = configs.find((item: any) => item.config_key === 'r2_bucket')?.config_value || ''
        const storageFolder = configs.find((item: any) => item.config_key === 'r2_storage_folder')?.config_value || ''

        if (directUpload) {
          const filePath = storageFolder && storageFolder !== '/'
            ? type && type !== '/' ? `${storageFolder}${type}/${file?.name}` : `${storageFolder}/${file?.name}`
            : type && type !== '/' ? `${type.slice(1)}/${file?.name}` : `${file?.name}`
          const client = getR2Client(configs)
          const presignedUrl = await generateR2PresignedUrl(client, bucket, filePath)
          return Response.json({
            code: 200,
            data: {
              upload_url: presignedUrl,
              key: filePath
            }
          })
        }
        return await r2Upload(file, type)
          .then((result: string) => {
            return Response.json({
              code: 200, data: result
            })
          })
          .catch(e => {
            throw new HTTPException(500, { message: 'Failed', cause: e })
          })
      }
      case 'alist':
        return await alistUpload(file, type, mountPath)
          .then((result: string) => {
            return Response.json({
              code: 200, data: result
            })
          })
          .catch(e => {
            throw new HTTPException(500, { message: 'Failed', cause: e })
          })
      default:
        throw new HTTPException(500, { message: 'storage not support' })
    }
  }
})

export default app