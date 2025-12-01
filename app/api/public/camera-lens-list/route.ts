import { NextResponse } from 'next/server'
import { fetchClientCameraAndLensList } from '~/server/db/query/images'
import { filterStringArray } from '~/lib/utils/array'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const album = searchParams.get('album') || undefined

    const { cameras, lenses } = await fetchClientCameraAndLensList(album)
    return NextResponse.json({
      cameras: filterStringArray(cameras),
      lenses: filterStringArray(lenses),
    })
  } catch (error) {
    console.error('Failed to fetch camera and lens list:', error)
    return NextResponse.json(
      { error: 'Failed to fetch camera and lens list' },
      { status: 500 }
    )
  }
}

