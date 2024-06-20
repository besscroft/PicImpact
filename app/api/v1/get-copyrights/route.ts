import 'server-only'
import { fetchCopyrightListByNotDefault } from '~/server/lib/query'

export async function GET() {
  const data = await fetchCopyrightListByNotDefault()
  return Response.json(data)
}

export const dynamic = 'force-dynamic'