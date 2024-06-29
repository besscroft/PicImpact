import 'server-only'
import { fetchTagsList } from '~/server/lib/query'

export async function GET() {
  const res = await fetchTagsList();
  const data = [{
    name: '首页',
    tag_value: '/'
  }]
  if (Array.isArray(res) && res.length > 0) {
    data.push(...res)
  }
  return Response.json(data)
}

export const dynamic = 'force-dynamic'