import 'server-only'
import { insertImage } from '~/server/lib/operate'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const image = await req.json()
  const data = await insertImage(image);
  return Response.json(data)
}