import 'server-only'
import { insertImages } from '~/server/lib/operate'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const json = await req.json()
  try {
    await insertImages(json);
    return Response.json({ code: 200, message: '还原成功！' })
  } catch (e) {
    console.log(e)
    return Response.json({ code: 500, message: '还原失败！' })
  }
}