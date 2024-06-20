import 'server-only'
import { updateCopyrightDefault } from '~/server/lib/operate'
import { NextRequest } from 'next/server'

export async function PUT(req: NextRequest) {
  const copyright = await req.json()
  const data = await updateCopyrightDefault(copyright.id, copyright.default);
  return Response.json(data)
}