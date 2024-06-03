import 'server-only'
import { updateCopyright } from '~/server/lib/operate'
import { NextRequest } from 'next/server'

export async function PUT(req: NextRequest) {
  const copyright = await req.json()
  try {
    await updateCopyright(copyright);
    return Response.json({ code: 200, message: '更新成功！' })
  } catch (e) {
    console.log(e)
    return Response.json({ code: 500, message: '更新失败！' })
  }
}