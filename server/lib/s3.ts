import 'server-only'

import type { Config } from '~/types'
import { Operator } from 'opendal'

let s3Operator: Operator | null = null

export async function getS3Operator(findConfig: Config[]) {
  if (!findConfig.length) {
    console.warn('警告：无法获取 S3 配置信息，请配置相应信息。')
  }
  if (s3Operator) return s3Operator

  const accesskeyId = findConfig.find((item: Config) => item.config_key === 'accesskey_id')?.config_value || ''
  const accesskeySecret = findConfig.find((item: Config) => item.config_key === 'accesskey_secret')?.config_value || ''
  const region = findConfig.find((item: Config) => item.config_key === 'region')?.config_value || ''
  const bucket = findConfig.find((item: Config) => item.config_key === 'bucket')?.config_value || ''
  const endpoint = findConfig.find((item: Config) => item.config_key === 'endpoint')?.config_value || ''
  // const forcePathStyle = findConfig.find((item: Config) => item.config_key === 'force_path_style')?.config_value

  s3Operator = new Operator('s3', {
    bucket: bucket,
    region: region,
    endpoint: endpoint.includes('https://') ? endpoint : `https://${endpoint}`,
    access_key_id: accesskeyId,
    secret_access_key: accesskeySecret,
  })

  return s3Operator
}
