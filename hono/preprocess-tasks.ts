import 'server-only'

import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'

import {
  cancelPreprocessTaskRun,
  createPreprocessTaskRun,
  getPreprocessTaskPreviewCount,
  getPreprocessTaskRunDetail,
  kickPreprocessTaskRun,
  listPreprocessTaskRuns,
  tickPreprocessTaskRuns,
} from '~/server/tasks/image-preprocess-service'
import { ADMIN_TASK_KEY_PREPROCESS_IMAGES, normalizePreprocessTaskScope } from '~/types/admin-tasks'
import { ok } from '~/hono/_lib/response'
import { badRequest, conflict, notFound, serverError } from '~/hono/_lib/errors'

const app = new Hono()

function ensureTaskKey(taskKey: unknown) {
  if (taskKey !== ADMIN_TASK_KEY_PREPROCESS_IMAGES) {
    throw badRequest('Unsupported task key')
  }
  return taskKey
}

function getScopeFromQuery(query: Record<string, string | undefined>) {
  return normalizePreprocessTaskScope({ force: query.force === 'true' })
}

function getScopeFromBody(body: Record<string, unknown> | null) {
  return normalizePreprocessTaskScope(body?.scope)
}

function rethrowTaskError(error: unknown): never {
  if (error instanceof HTTPException) {
    throw error
  }

  const message = error instanceof Error ? error.message : 'Task request failed'

  if (message === 'Another preprocess task is already active') {
    throw conflict(message)
  }

  if (message === 'No images matched the selected filters' || message === 'Variant storage backend is not configured') {
    throw badRequest(message)
  }

  throw serverError(message, error)
}

app.get('/preview-count', async (c) => {
  try {
    const scope = getScopeFromQuery(c.req.query())
    const data = await getPreprocessTaskPreviewCount(scope)
    return ok(c, data)
  } catch (error) {
    rethrowTaskError(error)
  }
})

app.get('/runs', async (c) => {
  try {
    const data = await listPreprocessTaskRuns()
    return ok(c, data)
  } catch (error) {
    rethrowTaskError(error)
  }
})

app.get('/runs/:id', async (c) => {
  try {
    const data = await getPreprocessTaskRunDetail(c.req.param('id'))

    if (!data) {
      throw notFound('Task run not found')
    }

    return ok(c, data)
  } catch (error) {
    rethrowTaskError(error)
  }
})

app.post('/runs', async (c) => {
  const body = await c.req.json<Record<string, unknown>>().catch(() => null)

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw badRequest('Invalid task request body')
  }

  try {
    ensureTaskKey(body.taskKey)
    const scope = getScopeFromBody(body)
    const data = await createPreprocessTaskRun(scope)

    if (!data) {
      throw conflict('Task system is busy, please retry shortly')
    }

    return ok(c, data)
  } catch (error) {
    rethrowTaskError(error)
  }
})

app.post('/runs/:id/kick', async (c) => {
  try {
    const data = await kickPreprocessTaskRun(c.req.param('id'))

    if (!data) {
      throw notFound('Task run not found')
    }

    return ok(c, data)
  } catch (error) {
    rethrowTaskError(error)
  }
})

app.post('/runs/:id/cancel', async (c) => {
  try {
    const data = await cancelPreprocessTaskRun(c.req.param('id'))

    if (!data) {
      throw notFound('Task run not found')
    }

    return ok(c, data)
  } catch (error) {
    rethrowTaskError(error)
  }
})

app.post('/tick', async (c) => {
  try {
    const data = await tickPreprocessTaskRuns()
    return ok(c, data)
  } catch (error) {
    console.error('Preprocess task tick failed:', error)
    rethrowTaskError(error)
  }
})

export default app
