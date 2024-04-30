import 'server-only'
import { deleteImage } from '~/server/lib/operate'
import { NextRequest } from 'next/server'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: number } },
) {
  try {
    await deleteImage(params.id);
    return Response.json({ code: 200, msg: '删除成功！' })
  } catch (e) {
    console.log(e)
    return Response.json({ code: 500, msg: '删除失败！' })
  }
}