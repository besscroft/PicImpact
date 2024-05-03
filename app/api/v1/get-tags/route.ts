import 'server-only'
import { fetchTagsList } from '~/server/lib/query'

export async function GET() {
  const data = await fetchTagsList();
  return Response.json(data)
}

export const dynamic = 'force-dynamic'