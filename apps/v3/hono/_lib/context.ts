import type { MiddlewareHandler } from 'hono'
import { auth } from '~/server/auth'
import { unauthorized } from '~/hono/_lib/errors'

type Session = Awaited<ReturnType<typeof auth.api.getSession>>

declare module 'hono' {
  interface ContextVariableMap {
    session: Session
  }
}

export const sessionMiddleware: MiddlewareHandler = async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  c.set('session', session)
  await next()
}

export const requireAuth: MiddlewareHandler = async (c, next) => {
  if (!c.get('session')) {
    throw unauthorized()
  }
  await next()
}
