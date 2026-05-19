import type { Context } from 'hono'

export const ok = <T>(c: Context, data?: T) =>
  c.json({ code: 200, message: 'Success', data })

export const okEmpty = (c: Context) =>
  c.json({ code: 200, message: 'Success' })
