import 'server-only'
import { insertImage } from '~/server/lib/operate'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const image = await req.json()
  try {
    await insertImage(image);
    return Response.json({ code: 200, msg: '保存成功！' })
  } catch (e) {
    return Response.json({ code: 500, msg: '保存失败！' })
  }
}