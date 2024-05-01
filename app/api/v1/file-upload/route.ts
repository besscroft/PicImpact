import { fetchAListInfo, fetchS3Info } from '~/server/lib/query'
import { s3 } from '~/server/lib/s3'
import { PutObjectCommand } from '@aws-sdk/client-s3'

export async function POST(request: Request) {
  const formData = await request.formData()

  const file = formData.get('file')
  const storage = formData.get('storage')
  const type = formData.get('type')
  const mountPath = formData.get('mountPath') || ''

  if (storage && storage.toString() === 's3') {
    const findConfig = await fetchS3Info();
    const bucket = findConfig.find((item: any) => item.config_key === 'bucket')?.config_value || '';
    const storageFolder = findConfig.find((item: any) => item.config_key === 'storage_folder')?.config_value || '';
    const endpoint = findConfig.find((item: any) => item.config_key === 'endpoint')?.config_value || '';

    // @ts-ignore
    const filePath = storageFolder && storageFolder !== '/'
      ? `${storageFolder}${type}/${file?.name}`
      : `${type}/${file?.name}`

    // @ts-ignore
    const blob = new Blob([file])
    const arrayBuffer = await blob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const params = {
      Bucket: bucket,
      Key: filePath,
      Body: buffer,
      ContentLength: file?.size,
      ContentType: file?.type
    };
    await s3.send(
      new PutObjectCommand(params)
    )
    return Response.json({ code: 200, data: `https://${bucket}.${endpoint}/${
      storageFolder && storageFolder !== '/'
        ? `${storageFolder}${type}/${encodeURIComponent(file?.name)}`
        : `${type}/${encodeURIComponent(file?.name)}`
      }`
    })
  } else {
    const findConfig = await fetchAListInfo()
    const alistToken = findConfig.find((item: any) => item.config_key === 'alist_token')?.config_value || '';
    const alistUrl = findConfig.find((item: any) => item.config_key === 'alist_url')?.config_value || '';

    const filePath = encodeURIComponent(`${mountPath && mountPath.toString() === '/' ? '' : mountPath}/${type}/${file?.name}`)
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
        body: JSON.stringify({ path: decodeURIComponent(filePath) })
      }).then((res) => res.json())
      if (res?.code === 200) {
        return Response.json({ code: 200, message: '文件上传成功！', data: res?.data.raw_url })
      } else {
        return Response.json({ code: 500, message: '文件路径获取失败！', data: null })
      }
    }
  }
  return Response.json({ code: 500, message: '文件上传失败！', data: null })
}