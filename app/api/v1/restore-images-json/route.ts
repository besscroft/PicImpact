import 'server-only'
import { insertImages } from '~/server/lib/operate'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const json = await req.json()
  const data = await insertImages(json);
  return Response.json(data)
}