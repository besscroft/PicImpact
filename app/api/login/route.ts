import 'server-only'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const res = await request.json()
  console.log(res)
  return Response.json(res)
}