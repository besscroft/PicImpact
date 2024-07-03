import 'server-only'
import { fetchTagsListAndNotDefault } from '~/server/lib/query'

export async function GET() {
  const data = await fetchTagsListAndNotDefault();
  return Response.json(data)
}

export const dynamic = 'force-dynamic'