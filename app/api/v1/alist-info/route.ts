import 'server-only'
import { fetchAListInfo } from '~/server/lib/query'

export async function GET() {
  const data = await fetchAListInfo();
  return Response.json(data)
}

export const dynamic = 'force-dynamic'