import 'server-only'

import path from 'node:path'
import { fetchConfigsByKeys } from '~/server/db/query/configs'
import { HTTPException } from 'hono/http-exception'
import { Config } from '~/types'
import {
  validateFilename,
  validateFileSize,
  validateMimeType,
} from '~/server/lib/upload-validation'

/**
 * Open List API 文件上传封装
 * @param file 文件
 * @param type 上传类型 '' | '/preview'
 * @param mountPath 挂载路径
 * @return {Promise<string>} 返回文件路径
 */
export async function openListUpload(file: any, type: any, mountPath: any): Promise<string | undefined> {
  // Defence in depth: validate even though the Hono handler already checked.
  // `openListUpload` is exported and may be called from other code paths.
  const safeName = validateFilename(file?.name)
  validateMimeType(file?.type)
  validateFileSize(file?.size)

  // Sanitize the mount path so a malicious caller can't traverse out via
  // `..` segments in the OpenList `File-Path` header. `path.basename` strips
  // any directory portion that might have been embedded.
  const mountString = mountPath == null ? '' : mountPath.toString()
  const mountBase = mountString === '/' || mountString === '' ? '' : path.basename(mountString)

  const findConfig = await fetchConfigsByKeys([
    'open_list_url',
    'open_list_token'
  ])
  const openListToken = findConfig.find((item: Config) => item.config_key === 'open_list_token')?.config_value || ''
  const openListUrl = findConfig.find((item: Config) => item.config_key === 'open_list_url')?.config_value || ''
  const mountPrefix = mountBase ? `/${mountBase}` : ''
  const filePath = encodeURIComponent(`${mountPrefix}${
    type && type !== '/' ? `${type}/${safeName}` : `/${safeName}`}`)
  const data = await fetch(`${openListUrl}/api/fs/put`, {
    method: 'PUT',
    headers: {
      'Authorization': openListToken.toString(),
      'File-Path': filePath.toString(),
    },
    body: file,
  }).then((res) => res.json())
  if (data?.code === 200) {
    const res = await fetch(`${openListUrl}/api/fs/get`, {
      method: 'POST',
      headers: {
        'Authorization': openListToken.toString(),
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