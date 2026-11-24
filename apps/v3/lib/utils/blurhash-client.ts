import { rgbaToThumbHash, thumbHashToDataURL} from 'thumbhash'

/**
 * https://github.com/evanw/thumbhash/blob/main/examples/browser/index.html
 * 图片转换为 blurhash，返回 base64 字符串
 * @param image 图片
 */
export const encodeBrowserThumbHash = async (image: any): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    const objectUrl = URL.createObjectURL(image)
    img.src = objectUrl

    img.onload = () => {
      // 创建 canvas 获取像素数据
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(objectUrl)
        return reject(new Error('无法获取 canvas 上下文'))
      }

      // 计算新的宽高以保持比例
      let resizeWidth = img.width
      let resizeHeight = img.height

      if (resizeWidth > resizeHeight) {
        if (resizeWidth > 100) {
          resizeHeight = Math.round((resizeHeight * 100) / resizeWidth)
          resizeWidth = 100
        }
      } else {
        if (resizeHeight > 100) {
          resizeWidth = Math.round((resizeWidth * 100) / resizeHeight)
          resizeHeight = 100
        }
      }

      canvas.width = resizeWidth
      canvas.height = resizeHeight
      ctx.drawImage(img, 0, 0)

      const imageData = ctx.getImageData(0, 0, resizeWidth, resizeHeight)
      const { width, height, data } = imageData

      // 转 RGBA 为 Uint8Array
      const rgba = new Uint8ClampedArray(data)
      const thumbhash = rgbaToThumbHash(width, height, rgba)

      // 转为 Base64
      const dataUrl = Buffer.from(thumbhash).toString('base64')
      resolve(dataUrl)

      // 清理资源
      URL.revokeObjectURL(objectUrl)
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('图片加载失败'))
    }
  })
}

/**
 * ThumbHash to data URL (can be done on the client, not the server)
 * @param hash blurhash base64 字符串
 */
export const decodeThumbHash = (hash: string): string => {
  if (!hash || hash === '') {
    return ''
  }
  const hashBuffer = Buffer.from(hash, 'base64')
  const hashArray = new Uint8Array(hashBuffer)
  return thumbHashToDataURL(hashArray)
}