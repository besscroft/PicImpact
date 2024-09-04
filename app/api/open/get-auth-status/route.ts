import 'server-only'
import { queryAuthStatus } from '~/server/lib/query'

export async function GET() {
  try {
    const data = await queryAuthStatus();

    return Response.json({
      code: 200,
      message: '获取双因素状态成功！',
      data: {
        auth_enable: data?.config_value
      }
    })
  } catch (e) {
    console.log(e)
    return Response.json({ code: 500, message: '获取双因素状态失败！' })
  }
}

export const dynamic = 'force-dynamic'