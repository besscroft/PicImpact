import 'server-only'

import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { alistUpload, r2Upload, s3Upload } from '~/server/lib/file-upload'

const app = new Hono()

app.post('/upload', async (c) => {
  const formData = await c.req.formData()

  const file = formData.get('file')
  const storage = formData.get('storage')
  const type = formData.get('type')
  const mountPath = formData.get('mountPath') || ''

  if (storage) {
    switch (storage.toString()) {
      case 's3':
        return await s3Upload(file, type)
          .then((result: string) => {
            return Response.json({
              code: 200, data: result
            })
          })
          .catch(e => {
            throw new HTTPException(500, { message: 'Failed', cause: e })
          })
      case 'r2':
        return await r2Upload(file, type)
          .then((result: string) => {
            return Response.json({
              code: 200, data: result
            })
          })
          .catch(e => {
            throw new HTTPException(500, { message: 'Failed', cause: e })
          })
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