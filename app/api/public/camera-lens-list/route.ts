import { NextResponse } from 'next/server'
import { fetchClientCameraAndLensList } from '~/server/db/query/images'
import { fetchDailyCameraAndLensList } from '~/server/db/query/daily'
import { fetchConfigValue } from '~/server/db/query/configs'
import { filterStringArray } from '~/lib/utils/array'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const album = searchParams.get('album') || undefined

    const dailyEnabled = await fetchConfigValue('daily_enabled', 'false')

    let cameras: string[], lenses: string[]
    if (dailyEnabled === 'true' && (!album || album === '/')) {
      ({ cameras, lenses } = await fetchDailyCameraAndLensList())
    } else {
      ({ cameras, lenses } = await fetchClientCameraAndLensList(album))
    }

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
