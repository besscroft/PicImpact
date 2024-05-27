import 'server-only'
import { updateS3Config } from '~/server/lib/operate'
import { NextRequest } from 'next/server'
import { Config } from '~/types'

export async function PUT(req: NextRequest) {
  const query = await req.json()

  const accesskeyId = query?.find((item: Config) => item.config_key === 'accesskey_id').config_value
  const accesskeySecret = query?.find((item: Config) => item.config_key === 'accesskey_secret').config_value
  const region = query?.find((item: Config) => item.config_key === 'region').config_value
  const endpoint = query?.find((item: Config) => item.config_key === 'endpoint').config_value
  const bucket = query?.find((item: Config) => item.config_key === 'bucket').config_value
  const storageFolder = query?.find((item: Config) => item.config_key === 'storage_folder').config_value
  const forcePathStyle = query?.find((item: Config) => item.config_key === 'force_path_style').config_value

  const data = await updateS3Config({ accesskeyId, accesskeySecret, region, endpoint, bucket, storageFolder, forcePathStyle });
  return Response.json(data)
}