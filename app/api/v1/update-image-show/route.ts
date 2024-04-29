import 'server-only'
import { updateImageShow } from '~/server/lib/operate'
import { NextRequest } from 'next/server'

export async function PUT(req: NextRequest) {
  const image = await req.json()
  const data = await updateImageShow(image.id, image.show);
  return Response.json(data)
}