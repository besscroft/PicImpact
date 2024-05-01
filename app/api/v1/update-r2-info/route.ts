import 'server-only'
import { updateR2Config } from '~/server/lib/operate'
import { NextRequest } from 'next/server'
import { Config } from '~/types'

export async function PUT(req: NextRequest) {
  const query = await req.json()

  const r2AccesskeyId = query?.find((item: Config) => item.config_key === 'r2_accesskey_id').config_value
  const r2AccesskeySecret = query?.find((item: Config) => item.config_key === 'r2_accesskey_secret').config_value
  const r2Endpoint = query?.find((item: Config) => item.config_key === 'r2_endpoint').config_value
  const r2Bucket = query?.find((item: Config) => item.config_key === 'r2_bucket').config_value
  const r2StorageFolder = query?.find((item: Config) => item.config_key === 'r2_storage_folder').config_value
  const r2PublicDomain = query?.find((item: Config) => item.config_key === 'r2_public_domain').config_value

  const data = await updateR2Config({ r2AccesskeyId, r2AccesskeySecret, r2Endpoint, r2Bucket, r2StorageFolder, r2PublicDomain });
  return Response.json(data)
}