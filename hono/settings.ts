import 'server-only'
import { fetchConfigsByKeys, fetchSecretKey, fetchUserById } from '~/server/db/query'
import { Config } from '~/types'
import { updateAListConfig, updateCustomInfo, updatePassword, updateR2Config, updateS3Config } from '~/server/db/operate'
import { auth } from '~/server/auth'
import CryptoJS from 'crypto-js'
import { Hono } from 'hono'

const app = new Hono()

app.get('/get-custom-info', async (c) => {
  const data = await fetchConfigsByKeys([
    'custom_title',
    'custom_favicon_url',
    'custom_author',
    'rss_feed_id',
    'rss_user_id',
    'preview_max_width_limit',
    'preview_max_width_limit_switch',
    'preview_quality',
  ]);
  return c.json(data)
})

app.get('/r2-info', async (c) => {
  const data = await fetchConfigsByKeys([
    'r2_accesskey_id',
    'r2_accesskey_secret',
    'r2_endpoint',
    'r2_bucket',
    'r2_storage_folder',
    'r2_public_domain'
  ]);
  return c.json(data)
})

app.get('/s3-info', async (c) => {
  const data = await fetchConfigsByKeys([
    'accesskey_id',
    'accesskey_secret',
    'region',
    'endpoint',
    'bucket',
    'storage_folder',
    'force_path_style',
    's3_cdn',
    's3_cdn_url'
  ]);
  return c.json(data)
})

app.put('/update-alist-info', async (c) => {
  const query = await c.req.json()

  const alistUrl = query?.find((item: Config) => item.config_key === 'alist_url').config_value
  const alistToken = query?.find((item: Config) => item.config_key === 'alist_token').config_value

  const data = await updateAListConfig({ alistUrl, alistToken });
  return c.json(data)
})

app.put('/update-r2-info', async (c) => {
  const query = await c.req.json()

  const r2AccesskeyId = query?.find((item: Config) => item.config_key === 'r2_accesskey_id').config_value
  const r2AccesskeySecret = query?.find((item: Config) => item.config_key === 'r2_accesskey_secret').config_value
  const r2Endpoint = query?.find((item: Config) => item.config_key === 'r2_endpoint').config_value
  const r2Bucket = query?.find((item: Config) => item.config_key === 'r2_bucket').config_value
  const r2StorageFolder = query?.find((item: Config) => item.config_key === 'r2_storage_folder').config_value
  const r2PublicDomain = query?.find((item: Config) => item.config_key === 'r2_public_domain').config_value

  const data = await updateR2Config({ r2AccesskeyId, r2AccesskeySecret, r2Endpoint, r2Bucket, r2StorageFolder, r2PublicDomain });
  return c.json(data)
})

app.put('/update-s3-info', async (c) => {
  const query = await c.req.json()

  const accesskeyId = query?.find((item: Config) => item.config_key === 'accesskey_id').config_value
  const accesskeySecret = query?.find((item: Config) => item.config_key === 'accesskey_secret').config_value
  const region = query?.find((item: Config) => item.config_key === 'region').config_value
  const endpoint = query?.find((item: Config) => item.config_key === 'endpoint').config_value
  const bucket = query?.find((item: Config) => item.config_key === 'bucket').config_value
  const storageFolder = query?.find((item: Config) => item.config_key === 'storage_folder').config_value
  const forcePathStyle = query?.find((item: Config) => item.config_key === 'force_path_style').config_value
  const s3Cdn = query?.find((item: Config) => item.config_key === 's3_cdn').config_value
  const s3CdnUrl = query?.find((item: Config) => item.config_key === 's3_cdn_url').config_value

  const data = await updateS3Config({ accesskeyId, accesskeySecret, region, endpoint, bucket, storageFolder, forcePathStyle, s3Cdn, s3CdnUrl });
  return c.json(data)
})

app.put('/update-custom-info', async (c) => {
  const query = await c.req.json() satisfies {
    title: string
    customFaviconUrl: string
    customAuthor: string
    feedId: string
    userId: string
    enablePreviewImageMaxWidthLimit: boolean
    previewImageMaxWidth: number
    previewQuality: number
  }
  try {
    await updateCustomInfo(query);
    return c.json({
      code: 200,
      message: '更新成功！'
    })
  } catch (e) {
    return Response.json({
      code: 500,
      message: '更新失败！'
    })
  }
})

app.put('/update-password', async (c) => {
  const { user } = await auth()
  const pwd = await c.req.json()
  const daUser = await fetchUserById(user?.id)
  const secretKey = await fetchSecretKey()
  if (!secretKey || !secretKey.config_value) {
    return Response.json({
      code: 500,
      message: '更新失败！'
    })
  }
  const hashedOldPassword = CryptoJS.HmacSHA512(pwd.oldPassword, secretKey?.config_value).toString()

  try {
    if (daUser && hashedOldPassword === daUser.password) {
      const hashedNewPassword = CryptoJS.HmacSHA512(pwd.newPassword, secretKey?.config_value).toString()
      await updatePassword(user?.id, hashedNewPassword);
      return c.json({
        code: 200,
        message: '更新成功！'
      })
    } else {
      return c.json({
        code: 500,
        message: '旧密码不匹配！'
      })
    }
  } catch (e) {
    console.log(e)
    return c.json({
      code: 500,
      message: '更新失败！'
    })
  }
})

export default app
