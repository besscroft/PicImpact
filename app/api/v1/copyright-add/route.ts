import 'server-only'
import { insertCopyright } from '~/server/lib/operate'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const copyright = await req.json()
  try {
    await insertCopyright(copyright);
    return Response.json({ code: 200, message: '新增成功！' })
  } catch (e) {
    console.log(e)
    return Response.json({ code: 500, message: '新增失败！' })
  }
}