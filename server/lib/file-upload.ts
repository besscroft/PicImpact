import 'server-only'

import { fetchConfigsByKeys } from '~/server/db/query/configs'
import { HTTPException } from 'hono/http-exception'
import { Config } from '~/types'

/**
 * AList API 文件上传封装
 * @param file 文件
 * @param type 上传类型 '' | '/preview'
 * @param mountPath 挂载路径
 * @return {Promise<string>} 返回文件路径
 */
export async function alistUpload(file: any, type: any, mountPath: any): Promise<string | undefined> {
  const findConfig = await fetchConfigsByKeys([
    'alist_url',
    'alist_token'
  ])
  const alistToken = findConfig.find((item: Config) => item.config_key === 'alist_token')?.config_value || ''
  const alistUrl = findConfig.find((item: Config) => item.config_key === 'alist_url')?.config_value || ''
  const filePath = encodeURIComponent(`${mountPath && mountPath.toString() === '/' ? '' : mountPath}${
    type && type !== '/' ? `${type}/${file?.name}` : `/${file?.name}`}`)
  const data = await fetch(`${alistUrl}/api/fs/put`, {
    method: 'PUT',
    headers: {
      'Authorization': alistToken.toString(),
      'File-Path': filePath.toString(),
    },
    body: file,
  }).then((res) => res.json())
  if (data?.code === 200) {
    const res = await fetch(`${alistUrl}/api/fs/get`, {
      method: 'POST',
      headers: {
        'Authorization': alistToken.toString(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({path: decodeURIComponent(filePath)})
    }).then((res) => res.json())
    if (res?.code === 200) {
      return res?.data.raw_url
    } else {
      throw new HTTPException(500, { message: 'Failed to retrieve file path' })
    }
  }
}