import { fetchAListInfo, fetchS3Info, fetchR2Info } from '~/server/lib/query'
import { getClient } from '~/server/lib/s3'
import { getR2Client } from '~/server/lib/r2'
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
    const forcePathStyle = findConfig.find((item: any) => item.config_key === 'force_path_style')?.config_value;
    // @ts-ignore
    const filePath = storageFolder && storageFolder !== '/'
      ? type && type !== '/' ? `${storageFolder}${type}/${file?.name}` : `${storageFolder}/${file?.name}`
      : type && type !== '/' ? `${type.slice(1)}/${file?.name}` : `${file?.name}`
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
    const s3 = getClient(findConfig);
    await s3.send(
      new PutObjectCommand(params)
    )

    if (forcePathStyle) {
      return Response.json({ code: 200, data: `https://${
          endpoint.includes('https://') ? endpoint.split('//')[1] : endpoint
        }/${bucket}/${
          storageFolder && storageFolder !== '/'
            ? type && type !== '/' ? `${storageFolder}${type}/${encodeURIComponent(file?.name)}` : `${storageFolder}/${encodeURIComponent(file?.name)}`
            : type && type !== '/' ? `${type.slice(1)}/${encodeURIComponent(file?.name)}` : `${encodeURIComponent(file?.name)}`
        }`
      })
    }
    return Response.json({ code: 200, data: `https://${bucket}.${
      endpoint.includes('https://') ? endpoint.split('//')[1] : endpoint
    }/${
      storageFolder && storageFolder !== '/'
        ? type && type !== '/' ? `${storageFolder}${type}/${encodeURIComponent(file?.name)}` : `${storageFolder}/${encodeURIComponent(file?.name)}`
        : type && type !== '/' ? `${type.slice(1)}/${encodeURIComponent(file?.name)}` : `${encodeURIComponent(file?.name)}`
      }`
    })
  } else if (storage && storage.toString() === 'r2') {
    const findConfig = await fetchR2Info();
    const r2Bucket = findConfig.find((item: any) => item.config_key === 'r2_bucket')?.config_value || '';
    const r2StorageFolder = findConfig.find((item: any) => item.config_key === 'r2_storage_folder')?.config_value || '';
    const r2Endpoint = findConfig.find((item: any) => item.config_key === 'r2_endpoint')?.config_value || '';
    const r2PublicDomain = findConfig.find((item: any) => item.config_key === 'r2_public_domain')?.config_value || '';

    // @ts-ignore
    const filePath = r2StorageFolder && r2StorageFolder !== '/'
      ? type && type !== '/' ? `${r2StorageFolder}${type}/${file?.name}` : `${r2StorageFolder}/${file?.name}`
      : type && type !== '/' ? `${type.slice(1)}/${file?.name}` : `${file?.name}`

    // @ts-ignore
    const blob = new Blob([file])
    const arrayBuffer = await blob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const r2 = getR2Client(findConfig);
    const params = {
      Bucket: r2Bucket,
      Key: filePath,
      Body: buffer,
      ContentLength: file?.size,
      ContentType: file?.type
    };
    await r2.send(
      new PutObjectCommand(params)
    )
    return Response.json({ code: 200, data: `${
      r2PublicDomain ? 
        r2PublicDomain.includes('https://') ? r2PublicDomain : `https://${r2PublicDomain}`
        : r2Endpoint.includes('https://') ? r2Endpoint : `https://${r2Endpoint}`
      }/${
        r2StorageFolder && r2StorageFolder !== '/'
          ? type && type !== '/' ? `${r2StorageFolder}${type}/${encodeURIComponent(file?.name)}` : `${r2StorageFolder}/${encodeURIComponent(file?.name)}`
          : type && type !== '/' ? `${type.slice(1)}/${encodeURIComponent(file?.name)}` : `${encodeURIComponent(file?.name)}`
      }`
    })
  } else {
    const findConfig = await fetchAListInfo()
    const alistToken = findConfig.find((item: any) => item.config_key === 'alist_token')?.config_value || '';
    const alistUrl = findConfig.find((item: any) => item.config_key === 'alist_url')?.config_value || '';
console.log('type', type)
    const filePath = encodeURIComponent(`${mountPath && mountPath.toString() === '/' ? '' : mountPath}${
      type && type !== '/' ? `${type}/${file?.name}` : `/${file?.name}` }`)
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