import 'server-only'
import { insertImage } from '~/server/lib/operate'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const image = await req.json()
  if (!image.url) {
    return Response.json({
      code: 500,
      message: '图片链接不能为空！'
    })
  }
  if (!image.height || image.height <= 0) {
    return Response.json({
      code: 500,
      message: '图片高度不能为空且必须大于 0！'
    })
  }
  if (!image.width || image.width <= 0) {
    return Response.json({
      code: 500,
      message: '图片宽度不能为空且必须大于 0！'
    })
  }
  try {
    await insertImage(image);
    return Response.json({ code: 200, msg: '保存成功！' })
  } catch (e) {
    console.log(e)
    return Response.json({ code: 500, msg: '保存失败！' })
  }
}