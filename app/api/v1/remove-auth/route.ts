import 'server-only'
import { deleteAuthSecret } from '~/server/lib/operate'
import { NextRequest } from 'next/server'

export async function DELETE(req: NextRequest) {
  try {
    await deleteAuthSecret();
    return Response.json({ code: 200, message: '移除成功！' })
  } catch (e) {
    console.log(e)
    return Response.json({ code: 500, message: '移除失败！' })
  }
}