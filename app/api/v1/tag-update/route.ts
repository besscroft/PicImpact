import 'server-only'
import { updateTag } from '~/server/lib/operate'
import { NextRequest } from 'next/server'

export async function PUT(req: NextRequest) {
  const tag = await req.json()
  const data = await updateTag(tag);
  return Response.json(data)
}