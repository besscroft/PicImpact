import 'server-only'
import { insertTag } from '~/server/lib/operate'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const tag = await req.json()
  if (tag.tag_value && tag.tag_value.charAt(0) !== '/') {
    return Response.json({
      code: 500,
      message: '路由必须以 / 开头！'
    })
  }
  try {
    await insertTag(tag);
    return Response.json({ code: 200, message: '更新成功！' })
  } catch (e) {
    console.log(e)
    return Response.json({ code: 500, message: '更新失败！' })
  }
}