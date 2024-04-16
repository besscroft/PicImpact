import 'server-only'
import { updateImage } from '~/server/lib/operate'
import { NextRequest } from 'next/server'

export async function PUT(req: NextRequest) {
  const image = await req.json()
  const data = await updateImage(image);
  return Response.json(data)
}