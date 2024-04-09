import 'server-only'
import { fetchImagesList } from '~/server/lib/query'

export async function GET() {
  const data = await fetchImagesList();
  return Response.json(data)
}