import 'server-only'
import { updateCustomTitle } from '~/server/lib/operate'
import { NextRequest } from 'next/server'

export async function PUT(req: NextRequest) {
  const query = await req.json()
  const data = await updateCustomTitle(query.title);
  return Response.json(data)
}