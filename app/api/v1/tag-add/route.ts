import 'server-only'
import { insertTag } from '~/server/lib/operate'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const tag = await req.json()
  const data = await insertTag(tag);
  return Response.json(data)
}