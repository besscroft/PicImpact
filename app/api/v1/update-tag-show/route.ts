import 'server-only'
import { updateTagShow } from '~/server/lib/operate'
import { NextRequest } from 'next/server'

export async function PUT(req: NextRequest) {
  const tag = await req.json()
  const data = await updateTagShow(tag.id, tag.show);
  return Response.json(data)
}