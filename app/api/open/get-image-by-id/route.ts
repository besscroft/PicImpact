import 'server-only'
import { fetchImageByIdAndAuth } from '~/server/lib/query'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const data = await fetchImageByIdAndAuth(Number(id));
    if (data && data?.length > 0) {
        return Response.json({ code: 200, msg: '图片数据获取成功！', data: data })
    } else {
        return Response.json({ code: 500, message: '图片不存在或未公开展示！' })
    }
}

export const dynamic = 'force-dynamic'