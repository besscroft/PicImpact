import { NextResponse } from 'next/server'
import { fetchCameraAndLensList } from '~/server/db/query/images'
import { filterStringArray } from '~/lib/utils/array'

export async function GET() {
  try {
    const { cameras, lenses } = await fetchCameraAndLensList()
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