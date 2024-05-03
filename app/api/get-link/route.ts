import 'server-only'
import { fetchTagsShow } from '~/server/lib/query'

export async function GET() {
  const data = await fetchTagsShow();
  return Response.json(data)
}

export const dynamic = 'force-dynamic'