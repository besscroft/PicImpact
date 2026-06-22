import 'server-only'

import { timingSafeEqual } from 'node:crypto'
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
import { badRequest, conflict, notFound, serverError, unauthorized } from '~/hono/_lib/errors'

const app = new Hono()

const TICK_SECRET_HEADER = 'x-preprocess-tick-secret'

/**
 * The `/tick` endpoint is the external-cron driver for the preprocess queue
 * (see docs/multi-replica.md). When running multiple replicas you typically
 * disable the in-process ticker and have a single external scheduler hit this
 * endpoint, so it can be reached publicly. Optionally gate it with a shared
 * secret: set `PREPROCESS_TICK_SECRET` and the caller must send it in the
 * `x-preprocess-tick-secret` header. When the env var is unset the endpoint
 * stays open (backward compatible with single-instance / internal-ticker
 * deployments). Constant-time compared; never logged.
 */
function assertTickAuthorized(provided: string | undefined) {
  const expected = process.env.PREPROCESS_TICK_SECRET
  if (!expected) return
  const providedBuf = Buffer.from(provided ?? '')
  const expectedBuf = Buffer.from(expected)
  if (providedBuf.length !== expectedBuf.length || !timingSafeEqual(providedBuf, expectedBuf)) {
    throw unauthorized('Invalid preprocess tick secret')
  }
}

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
  assertTickAuthorized(c.req.header(TICK_SECRET_HEADER))
  try {
    const data = await tickPreprocessTaskRuns()
    return ok(c, data)
  } catch (error) {
    console.error('Preprocess task tick failed:', error)
    rethrowTaskError(error)
  }
})

export default app
