import 'server-only'
import { queryAuthTemplateSecret } from '~/server/lib/query'
import { NextRequest } from 'next/server'
import * as OTPAuth from 'otpauth'
import { saveAuthSecret } from '~/server/lib/operate'

export async function POST(req: NextRequest) {
  const data = await req.json()
  try {
    const secret = await queryAuthTemplateSecret();
    let totp = new OTPAuth.TOTP({
      issuer: "PicImpact",
      label: "admin",
      algorithm: "SHA512",
      digits: 6,
      period: 30,
      // @ts-ignore
      secret: OTPAuth.Secret.fromBase32(secret?.config_value),
    });
    let delta = totp.validate({ token: data.token, window: 1 })
    if (delta === 0) {
      // @ts-ignore
      await saveAuthSecret('true', secret?.config_value)
      return Response.json({ code: 200, message: '设置成功！' })
    }
    return Response.json({ code: 500, message: '设置失败！' })
  } catch (e) {
    console.log(e)
    return Response.json({ code: 500, message: '设置失败！' })
  }
}