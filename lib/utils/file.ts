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
  // @ts-ignore
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
    if (res.data.upload_url) {
      // 直传模式
      try {
        const response = await fetch(res.data.upload_url, {
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
          data: res.data.key
        }
      } catch (error) {
        console.error('Direct upload failed:', error)
        throw new Error('Upload failed')
      }
    }
    return res
  }
  throw new Error('Upload failed')
}
