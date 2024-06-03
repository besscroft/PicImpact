import 'server-only'
import { updateCopyrightShow } from '~/server/lib/operate'
import { NextRequest } from 'next/server'

export async function PUT(req: NextRequest) {
  const copyright = await req.json()
  const data = await updateCopyrightShow(copyright.id, copyright.show);
  return Response.json(data)
}