import 'server-only'

import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'

import type { BackupPreviewData } from '~/types/backup'
import { previewBackupImport, exportBackupEnvelope, importBackupEnvelope } from '~/server/backup/service'
import { BackupValidationError } from '~/server/backup/format-adapter'
import { ok } from '~/hono/_lib/response'
import { badRequest, serverError } from '~/hono/_lib/errors'

const app = new Hono()

function createInvalidJsonPreview(message: string): BackupPreviewData {
  return {
    valid: false,
    format: null,
    version: null,
    exportedAt: null,
    source: null,
    scope: {
      included: ['configs', 'albums', 'images', 'imageAlbumRelations'],
      excluded: ['user', 'session', 'account', 'two_factor', 'passkey', 'verification', 'admin_task_runs', 'daily_images'],
    },
    counts: {
      configs: 0,
      albums: 0,
      images: 0,
      imageAlbumRelations: 0,
    },
    warnings: [],
    issues: [{
      path: '$',
      message,
    }],
  }
}

function getUtcFileName() {
  return `picimpact-backup-v1-${new Date().toISOString().replace(/:/g, '-')}.json`
}

function rethrowBackupError(error: unknown): never {
  if (error instanceof BackupValidationError) {
    throw badRequest(error.message, error)
  }

  if (error instanceof HTTPException) {
    throw error
  }

  throw serverError('Backup request failed', error)
}

app.get('/export', async (c) => {
  try {
    const envelope = await exportBackupEnvelope()
    return c.body(JSON.stringify(envelope, null, 2), 200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${getUtcFileName()}"`,
      'Cache-Control': 'no-store',
    })
  } catch (error) {
    rethrowBackupError(error)
  }
})

app.post('/import/preview', async (c) => {
  const body = await c.req.json<unknown>().catch(() => null)

  if (body === null) {
    return c.json({
      code: 400,
      message: 'Invalid JSON body',
      data: createInvalidJsonPreview('Request body must be valid JSON'),
    }, 400)
  }

  try {
    const data = await previewBackupImport(body)
    return ok(c, data)
  } catch (error) {
    if (error instanceof BackupValidationError) {
      return c.json({
        code: 400,
        message: error.message,
        data: error.preview,
      }, 400)
    }

    rethrowBackupError(error)
  }
})

app.post('/import', async (c) => {
  const body = await c.req.json<unknown>().catch(() => null)

  if (body === null) {
    return c.json({
      code: 400,
      message: 'Invalid JSON body',
      data: createInvalidJsonPreview('Request body must be valid JSON'),
    }, 400)
  }

  try {
    const data = await importBackupEnvelope(body)
    return ok(c, data)
  } catch (error) {
    if (error instanceof BackupValidationError) {
      return c.json({
        code: 400,
        message: error.message,
        data: error.preview,
      }, 400)
    }

    rethrowBackupError(error)
  }
})

export default app
