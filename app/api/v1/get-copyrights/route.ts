import 'server-only'
import { fetchCopyrightList } from '~/server/lib/query'

export async function GET() {
  const data = await fetchCopyrightList()
  return Response.json(data)
}

export const dynamic = 'force-dynamic'