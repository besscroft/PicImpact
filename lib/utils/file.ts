import ExifReader from 'exifreader'
import type { ExifType } from '~/types'

/**
 * 解析图片种的 exif
 * @param file 文件
 *
 * 注：用什么库解析无所谓，但为了向后兼容，exif 参数名字还是根据 ExifType 进行匹配即可。
 */
export async function exifReader(file: ArrayBuffer | SharedArrayBuffer | Buffer) {
  const tags = await ExifReader.load(file)
  const exifObj = {
    make: '',
    model: '',
    bits: '',
    data_time: '',
    exposure_time: '',
    f_number: '',
    exposure_program: '',
    iso_speed_rating: '',
    focal_length: '',
    lens_specification: '',
    lens_model: '',
    exposure_mode: '',
    cfa_pattern: '',
    color_space: '',
    white_balance: '',
  } as ExifType
  exifObj.make = tags?.Make?.description
  exifObj.model = tags?.Model?.description
  exifObj.bits = tags?.['Bits Per Sample']?.description
  exifObj.data_time = tags?.DateTimeOriginal?.description !== '' ? tags?.DateTimeOriginal?.description : tags?.DateTime?.description
  exifObj.exposure_time = tags?.ExposureTime?.description
  exifObj.f_number = tags?.FNumber?.description
  exifObj.exposure_program = tags?.ExposureProgram?.description
  exifObj.iso_speed_rating = tags?.ISOSpeedRatings?.description
  exifObj.focal_length = tags?.FocalLength?.description
  exifObj.lens_specification = tags?.LensSpecification?.description
  exifObj.lens_model = tags?.LensModel?.description
  exifObj.exposure_mode = tags?.ExposureMode?.description
  // @ts-expect-error CFAPattern is not included in the ExifReader types
  exifObj.cfa_pattern = tags?.CFAPattern?.description
  exifObj.color_space = tags?.ColorSpace?.description
  exifObj.white_balance = tags?.WhiteBalance?.description

  return {
    tags,
    exifObj
  }
}

/**
 * 上传 object 到对应的存储
 * @param file 文件 object 流
 * @param type 上传类型 '' | '/preview'
 * @param storage storage 存储类型
 * @param mountPath 文件挂载路径（目前只有 alist 用得到
 */
export async function uploadFile(file: File, type: string, storage: string, mountPath: string) {
  // 如果是 AList，使用旧的直传方式
  if (storage === 'alist') {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('storage', storage)
    formData.append('type', type)
    if (mountPath) {
      formData.append('mountPath', mountPath)
    }

    const res = await fetch('/api/v1/file/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      }
    }).then(res => res.json())

    if (res?.code === 200) {
      return res
    }
    throw new Error('Upload failed')
  }

  // 获取存储配置
  let directUpload = false
  if (storage === 's3') {
    const s3ConfigsResponse = await fetch('/api/v1/settings/s3-info', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    }).then(res => res.json())

    if (!Array.isArray(s3ConfigsResponse)) {
      throw new Error('Failed to get S3 configs')
    }

    directUpload = s3ConfigsResponse.find((item: any) => item.config_key === 's3_direct_upload')?.config_value === 'true'
  } else if (storage === 'r2') {
    const r2ConfigsResponse = await fetch('/api/v1/settings/r2-info', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    }).then(res => res.json())

    if (!Array.isArray(r2ConfigsResponse)) {
      throw new Error('Failed to get R2 configs')
    }

    directUpload = r2ConfigsResponse.find((item: any) => item.config_key === 'r2_direct_upload')?.config_value === 'true'
  }

  if (!directUpload) {
    // 如果未开启直传，使用旧的直传方式
    const formData = new FormData()
    formData.append('file', file)
    formData.append('storage', storage)
    formData.append('type', type)

    const res = await fetch('/api/v1/file/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      }
    }).then(res => res.json())

    if (res?.code === 200) {
      return res
    }
    throw new Error('Upload failed')
  }

  // 开启直传，使用预签名 URL
  const presignedResponse = await fetch('/api/v1/images/presigned-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      type: type,
      storage: storage
    })
  }).then(res => res.json())

  if (presignedResponse?.code !== 200) {
    throw new Error('Failed to get presigned URL')
  }

  const { presignedUrl, key } = presignedResponse.data

  // 使用预签名 URL 上传文件
  try {
    const response = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
      credentials: 'omit'
    })

    if (!response.ok) {
      throw new Error(`Upload failed with status: ${response.status}`)
    }

    return {
      code: 200,
      data: key
    }
  } catch (error) {
    console.error('Direct upload failed:', error)
    throw new Error('Upload failed')
  }
}
