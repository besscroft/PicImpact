import 'server-only'
import { deleteBatchImage } from '~/server/lib/operate'
import { NextRequest } from 'next/server'

export async function DELETE(req: NextRequest) {
  try {
    const data = await req.json()
    await deleteBatchImage(data);
    return Response.json({ code: 200, message: '删除成功！' })
  } catch (e) {
    console.log(e)
    return Response.json({ code: 500, message: '删除失败！' })
  }
}