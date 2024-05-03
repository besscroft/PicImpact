import 'server-only'
import { updateAListConfig } from '~/server/lib/operate'
import { NextRequest } from 'next/server'
import { Config } from '~/types'

export async function PUT(req: NextRequest) {
  const query = await req.json()

  const alistUrl = query?.find((item: Config) => item.config_key === 'alist_url').config_value
  const alistToken = query?.find((item: Config) => item.config_key === 'alist_token').config_value

  const data = await updateAListConfig({ alistUrl, alistToken });
  return Response.json(data)
}