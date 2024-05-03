import 'server-only'
import { fetchS3Info } from '~/server/lib/query'

export async function GET() {
  const data = await fetchS3Info();
  return Response.json(data)
}

export const dynamic = 'force-dynamic'