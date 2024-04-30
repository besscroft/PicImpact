import 'server-only'
import { fetchAListInfo } from '~/server/lib/query'

export async function GET() {
  const findConfig = await fetchAListInfo()
  const alistToken = findConfig.find((item: any) => item.config_key === 'alist_token')?.config_value || '';
  const alistUrl = findConfig.find((item: any) => item.config_key === 'alist_url')?.config_value || '';

  const data = await fetch(`${alistUrl}/api/admin/storage/list`, {
    method: 'get',
    headers: {
      'Authorization': alistToken.toString(),
    },
  }).then(res => res.json())

  return Response.json(data)
}

export const dynamic = 'force-dynamic'