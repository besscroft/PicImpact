import 'server-only'
import { updateImageTag } from '~/server/lib/operate'
import { NextRequest } from 'next/server'

export async function PUT(req: NextRequest) {
  const image = await req.json()
  try {
    await updateImageTag(image.imageId, image.tagId);
    return Response.json({
      code: 200,
      message: '更新成功！'
    })
  } catch (e) {
    console.log(e)
    return Response.json({
      code: 500,
      message: '更新失败！'
    })
  }
}