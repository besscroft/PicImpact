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

  if (storage && storage.toString() === 's3') {
    return await s3Upload(file, storage, type, mountPath)
      .then((result: string) => {
        return Response.json({
          code: 200, data: result
        })
      })
      .catch(e => {
        throw new HTTPException(500, { message: 'Failed', cause: e })
      })
  } else if (storage && storage.toString() === 'r2') {
    return await r2Upload(file, storage, type, mountPath)
      .then((result: string) => {
        return Response.json({
          code: 200, data: result
        })
      })
      .catch(e => {
        throw new HTTPException(500, { message: 'Failed', cause: e })
      })
  } else {
    return await alistUpload(file, storage, type, mountPath)
      .then((result: string) => {
        return Response.json({
          code: 200, data: result
        })
      })
      .catch(e => {
        throw new HTTPException(500, { message: 'Failed', cause: e })
      })
  }
})

export default app