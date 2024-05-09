import 'server-only'
import { fetchCustomTitle } from '~/server/lib/query'

export async function GET() {
  const data = await fetchCustomTitle();
  return Response.json(data)
}

export const dynamic = 'force-dynamic'