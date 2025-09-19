import 'server-only'
import { rgbaToThumbHash } from 'thumbhash'
import sharp from 'sharp'

/**
 * https://github.com/evanw/thumbhash/blob/main/examples/node/index.js
 * 图片转换为 blurhash，返回 base64 字符串
 * @param image 图片
 */
export const encodeThumbHash = async (image: ArrayBuffer): Promise<string> => {
  const imageBuffer = Buffer.from(image)
  const { data, info } = await sharp(imageBuffer)
    .resize(100, 100, { fit: 'inside' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const hash = rgbaToThumbHash(info.width, info.height, data)
  return Buffer.from(hash).toString('base64')
}