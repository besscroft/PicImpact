import 'server-only'

import type { Config } from '~/types'
import { Operator } from 'opendal'

let r2Operator: Operator | null = null

export async function getR2Operator(findConfig: Config[]) {
  if (!findConfig.length) {
    console.warn('警告：无法获取 R2 配置信息，请配置相应信息。')
  }
  if (r2Operator) return r2Operator

  const r2AccesskeyId = findConfig.find((item: Config) => item.config_key === 'r2_accesskey_id')?.config_value || ''
  const r2AccesskeySecret = findConfig.find((item: Config) => item.config_key === 'r2_accesskey_secret')?.config_value || ''
  const r2Endpoint = findConfig.find((item: Config) => item.config_key === 'r2_endpoint')?.config_value || ''
  const r2Bucket = findConfig.find((item: Config) => item.config_key === 'r2_bucket')?.config_value || ''

  r2Operator = new Operator('r2', {
    region: 'auto',
    bucket: r2Bucket,
    endpoint: r2Endpoint.includes('https://') ? r2Endpoint : `https://${r2Endpoint}`,
    access_key_id: r2AccesskeyId,
    secret_access_key: r2AccesskeySecret,
  })

  return r2Operator
}
