import 'server-only'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const imageUrl = searchParams.get('imageUrl')
  // @ts-ignore
  const blob = await fetch(imageUrl).then(res => res.blob())
  return new Response(blob)
}

export const revalidate = 0