import { HTTPException } from 'hono/http-exception'

export const badRequest = (message: string, cause?: unknown) =>
  new HTTPException(400, { message, cause })

export const unauthorized = (message = 'Authentication required') =>
  new HTTPException(401, { message })

export const notFound = (message = 'Not Found') =>
  new HTTPException(404, { message })

export const conflict = (message: string, cause?: unknown) =>
  new HTTPException(409, { message, cause })

export const serverError = (message = 'Internal Server Error', cause?: unknown) =>
  new HTTPException(500, { message, cause })
