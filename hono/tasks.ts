import 'server-only'

import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'

import {
  cancelMetadataTaskRun,
  createMetadataTaskRun,
  getMetadataTaskPreviewCount,
  getMetadataTaskRunDetail,
  kickMetadataTaskRun,
  listMetadataTaskRuns,
  tickMetadataTaskRuns,
} from '~/server/tasks/service'
import { ADMIN_TASK_KEY_REFRESH_IMAGE_METADATA, normalizeMetadataTaskScope } from '~/types/admin-tasks'

const app = new Hono()

function ensureTaskKey(taskKey: unknown) {
  if (taskKey !== ADMIN_TASK_KEY_REFRESH_IMAGE_METADATA) {
    throw new HTTPException(400, { message: 'Unsupported task key' })
  }

  return taskKey
}

function getScopeFromQuery(query: Record<string, string | undefined>) {
  return normalizeMetadataTaskScope({
    albumValue: query.albumValue,
    showStatus: query.showStatus,
  })
}

function getScopeFromBody(body: Record<string, unknown> | null) {
  return normalizeMetadataTaskScope(body?.scope)
}

function rethrowTaskError(error: unknown) {
  if (error instanceof HTTPException) {
    throw error
  }

  const message = error instanceof Error ? error.message : 'Task request failed'

  if (message === 'Another metadata task is already active') {
    throw new HTTPException(409, { message })
  }

  if (message === 'No images matched the selected filters') {
    throw new HTTPException(400, { message })
  }

  throw new HTTPException(500, { message, cause: error })
}

app.get('/preview-count', async (c) => {
  try {
    const scope = getScopeFromQuery(c.req.query())
    const data = await getMetadataTaskPreviewCount(scope)
    return c.json({ code: 200, message: 'Success', data })
  } catch (error) {
    rethrowTaskError(error)
  }
})

app.get('/runs', async (c) => {
  try {
    const data = await listMetadataTaskRuns()
    return c.json({ code: 200, message: 'Success', data })
  } catch (error) {
    rethrowTaskError(error)
  }
})

app.get('/runs/:id', async (c) => {
  try {
    const data = await getMetadataTaskRunDetail(c.req.param('id'))

    if (!data) {
      throw new HTTPException(404, { message: 'Task run not found' })
    }

    return c.json({ code: 200, message: 'Success', data })
  } catch (error) {
    rethrowTaskError(error)
  }
})

app.post('/runs', async (c) => {
  const body = await c.req.json<Record<string, unknown>>().catch(() => null)

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HTTPException(400, { message: 'Invalid task request body' })
  }

  try {
    ensureTaskKey(body.taskKey)
    const scope = getScopeFromBody(body)
    const data = await createMetadataTaskRun(scope)

    if (!data) {
      throw new HTTPException(409, { message: 'Task system is busy, please retry shortly' })
    }

    return c.json({ code: 200, message: 'Success', data }, 201)
  } catch (error) {
    rethrowTaskError(error)
  }
})

app.post('/runs/:id/kick', async (c) => {
  try {
    const data = await kickMetadataTaskRun(c.req.param('id'))

    if (!data) {
      throw new HTTPException(404, { message: 'Task run not found' })
    }

    return c.json({ code: 200, message: 'Success', data })
  } catch (error) {
    rethrowTaskError(error)
  }
})

app.post('/runs/:id/cancel', async (c) => {
  try {
    const data = await cancelMetadataTaskRun(c.req.param('id'))

    if (!data) {
      throw new HTTPException(404, { message: 'Task run not found' })
    }

    return c.json({ code: 200, message: 'Success', data })
  } catch (error) {
    rethrowTaskError(error)
  }
})

app.post('/tick', async (c) => {
  try {
    const data = await tickMetadataTaskRuns()
    return c.json({ code: 200, message: 'Success', data })
  } catch (error) {
    console.error('Task tick failed:', error)
    rethrowTaskError(error)
  }
})

export default app
