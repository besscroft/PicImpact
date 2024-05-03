import 'server-only'
import { fetchR2Info } from '~/server/lib/query'

export async function GET() {
  const data = await fetchR2Info();
  return Response.json(data)
}

export const dynamic = 'force-dynamic'