import { NextResponse } from 'next/server'

import { tickMetadataTaskRuns } from '~/server/tasks/service'

export async function POST() {
  try {
    const data = await tickMetadataTaskRuns()
    return NextResponse.json({ code: 200, message: 'Success', data })
  } catch (error) {
    console.error('Task tick failed:', error)
    return NextResponse.json({ code: 500, message: 'Task tick failed' }, { status: 500 })
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
