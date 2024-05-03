import 'server-only'
import { fetchAllImages } from '~/server/lib/query'

export async function GET() {
  const data = await fetchAllImages();
  return Response.json(data)
}

export const dynamic = 'force-dynamic'