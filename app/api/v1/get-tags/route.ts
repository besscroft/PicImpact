import 'server-only'
import { fetchTags } from '~/server/lib/query'

export async function GET() {
  const data = await fetchTags();
  return Response.json(data)
}